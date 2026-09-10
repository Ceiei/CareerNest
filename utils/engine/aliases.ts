export interface AliasRule {
  suffix: string;
  aliases: string[];
  autocomplete?: string[];
}

export const ALIAS_RULES: AliasRule[] = [
  { suffix: 'fullName', aliases: ['姓名', '真实姓名', '中文姓名', 'name', 'full name', 'legal name'], autocomplete: ['name'] },
  { suffix: 'englishName', aliases: ['英文名', '拼音姓名', 'english name'] },
  { suffix: 'gender', aliases: ['性别', 'gender', 'sex'], autocomplete: ['sex'] },
  { suffix: 'birthDate', aliases: ['出生日期', '出生年月', '生日', 'date of birth', 'birthday'], autocomplete: ['bday'] },
  { suffix: 'phone', aliases: ['手机号', '手机号码', '联系电话', '联系电话号码', 'mobile', 'phone', 'telephone'], autocomplete: ['tel', 'tel-national'] },
  { suffix: 'email', aliases: ['邮箱', '电子邮箱', '电子邮件', 'email', 'e-mail'], autocomplete: ['email'] },
  { suffix: 'idNumber', aliases: ['身份证号', '身份证号码', '证件号码', '证件号', 'id number', 'passport number'] },
  { suffix: 'nationality', aliases: ['国籍', 'nationality', 'country of citizenship'], autocomplete: ['country-name'] },
  { suffix: 'nativePlace', aliases: ['籍贯', '生源地', '户籍所在地', 'native place'] },
  { suffix: 'politicalStatus', aliases: ['政治面貌', '政治身份', 'political status'] },
  { suffix: 'address', aliases: ['联系地址', '通讯地址', '现居住地', '家庭住址', 'address'], autocomplete: ['street-address'] },
  { suffix: 'studentId', aliases: ['学号', 'student id', 'student number'] },
  { suffix: 'ethnicGroup', aliases: ['民族', 'ethnicity', 'ethnic group'] },
  { suffix: 'householdRegistration', aliases: ['户籍所在地', '户口所在地', '户籍地址', 'household registration'] },
  { suffix: 'emergencyContact', aliases: ['紧急联系人', '应急联系人', 'emergency contact'] },
  { suffix: 'emergencyPhone', aliases: ['紧急联系电话', '紧急联系人电话', 'emergency phone'] },
  { suffix: 'school', aliases: ['学校', '院校', '毕业院校', '就读学校', '学校名称', 'university', 'college', 'school'] },
  { suffix: 'degree', aliases: ['学历', '学历层次', '教育程度', 'education level', 'education background'] },
  { suffix: 'academicDegree', aliases: ['学位', '所获学位', 'degree awarded', 'academic degree'] },
  { suffix: 'major', aliases: ['专业', '专业名称', '主修专业', 'major', 'field of study'] },
  { suffix: 'startDate', aliases: ['开始日期', '入学时间', '入职时间', '起始时间', 'start date', 'from'] },
  { suffix: 'endDate', aliases: ['结束日期', '毕业时间', '离职时间', '终止时间', 'end date', 'to'] },
  { suffix: 'gpa', aliases: ['gpa', '平均绩点', '绩点'] },
  { suffix: 'ranking', aliases: ['成绩排名', '专业排名', '排名', 'rank'] },
  { suffix: 'company', aliases: ['公司', '单位名称', '实习单位', '工作单位', 'company', 'employer', 'organization'] },
  { suffix: 'position', aliases: ['职位', '岗位', '职务', '实习岗位', 'position', 'job title'] },
  { suffix: 'department', aliases: ['部门', '院系', '学院', 'department', 'faculty'] },
  { suffix: 'projectName', aliases: ['项目名称', '项目名', 'project name'] },
  { suffix: 'role', aliases: ['项目角色', '担任角色', 'role'] },
  { suffix: 'researchTopic', aliases: ['研究方向', '研究课题', 'research topic', 'research area'] },
  { suffix: 'advisor', aliases: ['导师', '指导老师', 'supervisor', 'advisor'] },
  { suffix: 'title', aliases: ['论文标题', '论文名称', '成果名称', 'title'] },
  { suffix: 'venue', aliases: ['期刊', '会议', '发表平台', 'journal', 'conference', 'venue'] },
  { suffix: 'awardName', aliases: ['奖项名称', '竞赛名称', '荣誉名称', 'award'] },
  { suffix: 'level', aliases: ['奖项级别', '获奖等级', '级别', 'level'] },
  { suffix: 'date', aliases: ['日期', '获奖时间', '发表时间', 'date'] },
  { suffix: 'skills', aliases: ['技能', '专业技能', '技术栈', 'skills'] }
];

export function suffixOf(key: string): string {
  return key.split('.').at(-1) ?? key;
}
