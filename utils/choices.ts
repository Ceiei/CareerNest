import { normalizeText, similarity } from './engine/text';

export interface CanonicalChoice {
  value: string;
  label: string;
  aliases: string[];
}

export const CHOICE_SETS = {
  gender: [
    ['男', '男', ['男性', 'male', 'm']], ['女', '女', ['女性', 'female', 'f']],
    ['其他', '其他', ['其它', 'other']], ['不便透露', '不便透露', ['保密', 'prefer not to say']]
  ],
  politicalStatus: [
    ['中共党员', '中共党员', ['中国共产党党员', '共产党员', '党员']],
    ['中共预备党员', '中共预备党员', ['预备党员']], ['共青团员', '共青团员', ['团员']],
    ['群众', '群众', []], ['无党派人士', '无党派人士', ['无党派']], ['民主党派', '民主党派', ['民主党派成员']], ['其他', '其他', ['其它']]
  ],
  idType: [
    ['居民身份证', '居民身份证', ['身份证', '中华人民共和国居民身份证', 'national id', 'identity card']],
    ['护照', '护照', ['passport']], ['港澳居民来往内地通行证', '港澳居民来往内地通行证', ['回乡证']],
    ['台湾居民来往大陆通行证', '台湾居民来往大陆通行证', ['台胞证']],
    ['港澳台居民居住证', '港澳台居民居住证', ['港澳居民居住证', '台湾居民居住证']],
    ['外国人永久居留身份证', '外国人永久居留身份证', ['外国人永久居留证', '中国绿卡']], ['其他', '其他', ['其它']]
  ],
  educationLevel: [
    ['高中', '高中', ['高级中学', 'high school']], ['中专', '中专', ['中等专科学校', 'secondary vocational']],
    ['专科', '专科', ['大专', '高职', 'associate', 'college diploma']],
    ['本科', '本科', ['本科生', '大学本科', 'undergraduate', 'bachelor level']],
    ['硕士研究生', '硕士研究生', ['硕士', '研究生（硕士）', 'master', 'masters', 'postgraduate']],
    ['博士研究生', '博士研究生', ['博士', '研究生（博士）', 'phd', 'doctoral', 'doctorate']], ['其他', '其他', ['其它']]
  ],
  academicDegree: [
    ['无学位', '无学位', ['无', 'none']], ['学士', '学士', ['学士学位', 'bachelor', "bachelor's degree", 'bachelor degree', 'ba', 'bs', 'bsc', 'beng']],
    ['硕士', '硕士', ['硕士学位', "master's degree", 'master degree', 'ma', 'ms', 'msc', 'meng']],
    ['博士', '博士', ['博士学位', 'phd', 'doctoral degree', 'doctorate']], ['其他', '其他', ['其它']]
  ],
  enrollmentType: [
    ['全日制', '全日制', ['全日制统招', '统招全日制', 'full time', 'full-time']],
    ['非全日制', '非全日制', ['在职', 'part time', 'part-time']], ['其他', '其他', ['其它']]
  ],
  yesNo: [['是', '是', ['有', '愿意', '接受', 'yes', 'true', '1']], ['否', '否', ['无', '不愿意', '不接受', 'no', 'false', '0']]],
  applicationType: [
    ['夏令营', '夏令营', ['优秀大学生夏令营', '暑期夏令营']], ['预推免', '预推免', ['预报名', '推免预报名']],
    ['九月推免', '九月推免', ['九推', '正式推免']], ['直博', '直博', ['本科直博', 'direct phd']],
    ['硕博连读', '硕博连读', ['硕博', 'master phd']], ['其他', '其他', ['其它']]
  ],
  recommendationStatus: [
    ['已获得', '已获得', ['已取得', '有推免资格']], ['预计获得', '预计获得', ['预计取得', '有望获得']],
    ['未获得', '未获得', ['无推免资格']], ['不确定', '不确定', ['待定', '尚未确定']]
  ],
  availability: [
    ['1周内', '1周内', ['一周内', 'within 1 week']], ['2周内', '2周内', ['两周内', 'within 2 weeks']],
    ['1个月内', '1个月内', ['一个月内', 'within 1 month']], ['3个月内', '3个月内', ['三个月内', 'within 3 months']], ['其他', '其他', ['其它']]
  ],
  internshipDuration: [
    ['3个月以内', '3个月以内', ['三个月以内', '<3个月', 'less than 3 months']],
    ['3-6个月', '3–6个月', ['3至6个月', '三到六个月', '3~6个月', '3-6 months']],
    ['6个月以上', '6个月以上', ['六个月以上', '>6个月', '6+ months']], ['其他', '其他', ['其它']]
  ],
  daysPerWeek: [['1天', '1天', ['每周1天']], ['2天', '2天', ['每周2天']], ['3天', '3天', ['每周3天']], ['4天', '4天', ['每周4天']], ['5天', '5天', ['每周5天']]],
  experienceType: [['实习', '实习', ['实习生', 'internship', 'intern']], ['全职', '全职', ['正式工作', 'full time', 'full-time']], ['兼职', '兼职', ['part time', 'part-time']], ['校园经历', '校园经历', ['学生工作', '社团经历']], ['其他', '其他', ['其它']]],
  awardLevel: [['国际级', '国际级', ['国际', 'international']], ['国家级', '国家级', ['全国', 'national']], ['省级', '省级', ['省部级', 'provincial']], ['市级', '市级', ['地市级', 'municipal']], ['校级', '校级', ['学校级']], ['院级', '院级', ['学院级']], ['其他', '其他', ['其它']]]
} as const satisfies Record<string, readonly (readonly [string, string, readonly string[]])[]>;

export type ChoiceKey = keyof typeof CHOICE_SETS;

export function choices(key: ChoiceKey): CanonicalChoice[] {
  return CHOICE_SETS[key].map(([value, label, aliases]) => ({ value, label, aliases: [...aliases] }));
}

export function canonicalChoiceValue(key: ChoiceKey, raw: string): string | undefined {
  const normalized = normalizeText(raw);
  return choices(key).find(choice => [choice.value, choice.label, ...choice.aliases].some(item => normalizeText(item) === normalized))?.value;
}

export const PATH_CHOICES: Record<string, ChoiceKey> = {
  'personal.gender': 'gender', 'personal.politicalStatus': 'politicalStatus', 'custom.idType': 'idType',
  'education.*.degree': 'educationLevel', 'education.*.academicDegree': 'academicDegree', 'education.*.enrollmentType': 'enrollmentType',
  'experience.*.workType': 'experienceType', 'awards.*.level': 'awardLevel',
  'preferences.applicationType': 'applicationType', 'preferences.adjustmentAccepted': 'yesNo',
  'preferences.recommendationStatus': 'recommendationStatus', 'preferences.availability': 'availability',
  'preferences.internshipDuration': 'internshipDuration', 'preferences.daysPerWeek': 'daysPerWeek'
};

export function choiceKeyForPath(path: string): ChoiceKey | undefined {
  return PATH_CHOICES[path.replace(/\.\d+\./g, '.*.')];
}

export function choiceVariants(raw: string): string[] {
  const normalized = normalizeText(raw);
  for (const key of Object.keys(CHOICE_SETS) as ChoiceKey[]) for (const choice of choices(key)) {
    const variants = [choice.value, choice.label, ...choice.aliases];
    if (variants.some(item => normalizeText(item) === normalized)) return variants;
  }
  return [raw];
}

function matchingChoiceKeys(raw: string): ChoiceKey[] {
  const normalized = normalizeText(raw);
  return (Object.keys(CHOICE_SETS) as ChoiceKey[]).filter(key => choices(key).some(choice =>
    [choice.value, choice.label, ...choice.aliases].some(item => normalizeText(item) === normalized)
  ));
}

export function choiceMatchScore(target: string, raw: string): number {
  const sourceKeys = matchingChoiceKeys(raw);
  const targetKeys = matchingChoiceKeys(target);
  if (sourceKeys.length && targetKeys.length && !sourceKeys.some(key => targetKeys.includes(key))) return 0;
  return Math.max(...choiceVariants(raw).map(variant => similarity(target, variant)));
}
