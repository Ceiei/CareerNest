// Keep the observed sample paths stable so existing custom data needs no migration.
export interface BasicField {
  key: string;
  label: string;
  type?: 'text' | 'date' | 'tel' | 'url' | 'textarea';
  hint?: string;
  sensitive?: boolean;
  modes?: Array<'job' | 'academic'>;
}

const forMode = (mode: 'job' | 'academic', fields: BasicField[]): BasicField[] =>
  fields.map(field => ({ ...field, modes: [mode] }));

export const BASIC_GROUPS: Array<{ title: string; root: 'custom' | 'preferences'; fields: BasicField[] }> = [
  { title: '身份与所在地', root: 'custom', fields: [
    { key: 'idType', label: '证件类型', hint: '如居民身份证、护照；与证件号码对应' },
    { key: 'phoneCountryCode', label: '手机国家区号', hint: '如 +86' },
    { key: 'currentCity', label: '现居城市', sensitive: true },
    { key: 'homeTown', label: '家乡', sensitive: true },
    { key: 'workYears', label: '工作年限', hint: '如适用，按实际工作经历填写', modes: ['job'] },
    { key: 'latestCompany', label: '最近工作单位', modes: ['job'] }
  ] },
  { title: '个人介绍与主页', root: 'custom', fields: [
    { key: 'selfDescription', label: '自我评价', type: 'textarea' },
    { key: 'hobbies', label: '兴趣爱好', type: 'textarea' },
    { key: 'homepage', label: '个人主页', type: 'url', sensitive: true },
    { key: 'github', label: 'GitHub', type: 'url', sensitive: true },
    { key: 'portfolioLinks', label: '作品链接', type: 'textarea', hint: '多个链接可分行填写', sensitive: true },
    { key: 'wechat', label: '微信号', sensitive: true },
    { key: 'qq', label: 'QQ', sensitive: true }
  ] },
  { title: '证明人', root: 'custom', fields: [
    { key: 'referenceName', label: '证明人姓名', sensitive: true },
    { key: 'referencePhone', label: '证明人电话', type: 'tel', sensitive: true },
    { key: 'referenceRelation', label: '与证明人关系' },
    { key: 'recruitmentSource', label: '招聘信息来源', modes: ['job'] }
  ] },
  { title: '求职与实习安排', root: 'preferences', fields: forMode('job', [
    { key: 'workCity', label: '期望工作地点', hint: '多个城市用顿号分隔' },
    { key: 'interviewCity', label: '面试城市' },
    { key: 'businessGroup', label: '意向事业群' },
    { key: 'department', label: '意向部门' },
    { key: 'availableDate', label: '可到岗日期', type: 'date' },
    { key: 'availability', label: '到岗时间', hint: '相对时间，如 1周内；申请前确认是否仍适用' },
    { key: 'internshipDuration', label: '实习时长', hint: '如 3-6个月' },
    { key: 'daysPerWeek', label: '每周出勤', hint: '如 4天' },
    { key: 'expectedSalary', label: '期望薪资', hint: '注明币种、月薪或年薪', sensitive: true },
    { key: 'currentSalary', label: '当前薪资', hint: '如适用，注明币种、月薪或年薪', sensitive: true }
  ]) },
  { title: '夏令营与学校申请', root: 'preferences', fields: forMode('academic', [
    { key: 'targetSchool', label: '目标院校' },
    { key: 'targetDepartment', label: '目标院系' },
    { key: 'targetProgram', label: '申请专业／项目' },
    { key: 'applicationType', label: '申请类型', hint: '如夏令营、预推免、九推' },
    { key: 'summerCampName', label: '夏令营名称' },
    { key: 'expectedEnrollmentYear', label: '拟入学年份' },
    { key: 'preferredAdvisor', label: '意向导师' },
    { key: 'researchInterest', label: '意向研究方向', type: 'textarea' },
    { key: 'adjustmentAccepted', label: '是否服从调剂' },
    { key: 'recommendationStatus', label: '推免资格情况' },
    { key: 'englishLevel', label: '外语水平／成绩' },
    { key: 'applicationStatement', label: '申请陈述／报考理由', type: 'textarea' }
  ]) }
];

export const BASIC_FIELDS = BASIC_GROUPS.flatMap(group => group.fields.map(field => ({ ...field, root: group.root })));
