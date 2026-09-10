"""Deterministic retrieval and source validation. No model can write the truth store."""
import re
from collections import Counter
from typing import Dict, List

COLLECTIONS = {
    'education': '教育经历', 'experience': '实习／工作', 'projects': '项目',
    'research': '科研', 'publications': '论文', 'awards': '获奖',
}
LABELS = {
    'school': '学校', 'degree': '学历', 'academicDegree': '学位', 'major': '专业',
    'department': '院系／部门', 'company': '公司', 'position': '职位', 'projectName': '项目名称',
    'researchTopic': '研究方向', 'title': '标题', 'venue': '期刊／会议', 'awardName': '奖项',
    'startDate': '开始时间', 'endDate': '结束时间', 'date': '日期', 'gpa': 'GPA', 'ranking': '排名',
    'role': '角色', 'responsibilities': '职责', 'description': '内容', 'achievements': '成果',
    'advisor': '导师', 'level': '级别', 'technologies': '技术', 'context': '背景', 'results': '结果',
}


def profile_facts(profile: Dict) -> List[Dict]:
    facts = []
    for collection, label in COLLECTIONS.items():
        for index, record in enumerate(profile.get(collection, [])):
            record_id = str(record['id'])
            values = [(key, value) for key, value in record.items() if key != 'id' and value != '']
            if not values:
                continue
            title = str(next((record[k] for k in ('projectName', 'researchTopic', 'company', 'school', 'title', 'awardName') if record.get(k)), label))
            text = '\n'.join(f'{LABELS.get(key, key)}：{value}' for key, value in values)
            facts.append(dict(id=f'{collection}:{record_id}', title=title, text=text,
                              section=label, record_id=record_id, source_path=f'{collection}.{index}',
                              comfort='可以展开讲', evidence=[], technologies=[], origin='profile'))
    if profile.get('skills'):
        facts.append(dict(id='profile:skills', title='技能', text='技能：' + '、'.join(profile['skills']),
                          section='技能', comfort='基础使用', evidence=[], technologies=profile['skills'], origin='profile'))
    return facts


def tokens(text: str) -> List[str]:
    english = re.findall(r'[a-z][a-z0-9+#.\-]*', text.lower())
    chinese = re.findall(r'[\u4e00-\u9fff]+', text)
    return english + [word[i:i + 2] for word in chinese for i in range(max(1, len(word) - 1))]


def source_text(fact: Dict) -> str:
    parts = [fact['text']]
    for key, label in (('context', '背景'), ('actions', '动作'), ('results', '结果')):
        if fact.get(key):
            parts.append(label + '：' + fact[key])
    if fact.get('technologies') and fact.get('origin') == 'confirmed':
        parts.append('技术：' + '、'.join(fact['technologies']))
    return '\n'.join(parts)


def parse_job(description: str) -> Dict:
    lines = [line.strip(' \t-•') for line in description.splitlines() if line.strip()]
    requirements = [line for line in lines if re.search(r'要求|熟悉|熟练|掌握|具备|经验|资格|成绩|require|experience|skill|proficien', line, re.I)]
    return dict(requirements=(requirements or lines)[:25], keywords=[key for key, _ in Counter(tokens(description)).most_common(24)],
                method='local_keyword_rules', notes='本地规则提取；请核对要求。相关度不是录用概率。')


def rank_facts(job: Dict, facts: List[Dict]) -> List[Dict]:
    query = set(tokens(job['title'] + '\n' + job['description']))
    ranked = []
    for fact in facts:
        terms = set(tokens(fact['title'] + '\n' + source_text(fact)))
        overlap = sorted(query & terms)
        score = round(len(overlap) / max(1, len(query)) * 100, 1)
        ranked.append(dict(**fact, score=score, matched_terms=overlap[:12],
                           reason='命中：' + '、'.join(overlap[:8]) if overlap else '无关键词命中，可手动选择'))
    return sorted(ranked, key=lambda f: (-f['score'], f['id']))


def validate_bullets(bullets: List[Dict], sources: Dict[str, Dict]) -> Dict:
    issues, review = [], []
    for index, bullet in enumerate(bullets):
        refs = bullet.get('source_facts', [])
        if not refs or any(ref not in sources for ref in refs):
            issues.append(f'第 {index + 1} 条缺少有效来源')
            continue
        evidence = '\n'.join(source_text(sources[ref]) for ref in refs)
        nums = set(re.findall(r'\d+(?:[.,]\d+)*(?:%|％)?', evidence))
        unknown = set(re.findall(r'\d+(?:[.,]\d+)*(?:%|％)?', bullet['text'])) - nums
        if unknown:
            issues.append(f'第 {index + 1} 条有来源外数字：' + '、'.join(sorted(unknown)))
        if bullet['text'] not in [source_text(sources[ref]) for ref in refs]:
            review.append(f'第 {index + 1} 条改写需人工核对实体、技术、结果、因果和表达强度')
        for ref in refs:
            if sources[ref].get('comfort') in ('仅了解', '基础使用') and re.search(r'精通|熟练掌握|专家|主导', bullet['text']):
                issues.append(f'第 {index + 1} 条超出来源的表达上限')
    return dict(valid=not issues, issues=issues, review=review,
                checks=['来源 ID 存在', '数字在对应来源中出现', '基础表达上限'],
                limitation='规则不能证明任意改写的语义真实性；改写必须由用户逐条确认。')
