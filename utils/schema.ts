export interface SchemaField {
  key: string;
  label: string;
  type?: 'text' | 'date' | 'number' | 'textarea';
  choiceKey?: import('./choices').ChoiceKey;
}

export interface CollectionSchema {
  label: string;
  fields: SchemaField[];
}

export const COLLECTION_SCHEMAS = {
  education: {
    label: '教育经历',
    fields: [
      { key: 'school', label: '学校' }, { key: 'degree', label: '学历层次', choiceKey: 'educationLevel' },
      { key: 'academicDegree', label: '学位', choiceKey: 'academicDegree' },
      { key: 'major', label: '专业' }, { key: 'department', label: '院系' },
      { key: 'startDate', label: '入学日期', type: 'date' }, { key: 'endDate', label: '毕业日期', type: 'date' },
      { key: 'gpa', label: 'GPA' }, { key: 'ranking', label: '成绩排名' },
      { key: 'enrollmentType', label: '培养方式', choiceKey: 'enrollmentType' }
    ]
  },
  experience: {
    label: '实习／工作经历',
    fields: [
      { key: 'company', label: '单位／公司' }, { key: 'workType', label: '经历类型', choiceKey: 'experienceType' }, { key: 'department', label: '部门' },
      { key: 'position', label: '职位' }, { key: 'city', label: '城市' },
      { key: 'startDate', label: '开始日期', type: 'date' }, { key: 'endDate', label: '结束日期', type: 'date' },
      { key: 'responsibilities', label: '职责', type: 'textarea' }, { key: 'achievements', label: '成果', type: 'textarea' }
    ]
  },
  projects: {
    label: '项目经历',
    fields: [
      { key: 'projectName', label: '项目名称' }, { key: 'role', label: '担任角色' },
      { key: 'startDate', label: '开始日期', type: 'date' }, { key: 'endDate', label: '结束日期', type: 'date' },
      { key: 'description', label: '项目描述', type: 'textarea' }, { key: 'achievements', label: '项目成果', type: 'textarea' }
    ]
  },
  research: {
    label: '科研经历',
    fields: [
      { key: 'researchTopic', label: '研究课题／方向' }, { key: 'advisor', label: '导师' },
      { key: 'role', label: '角色' }, { key: 'startDate', label: '开始日期', type: 'date' },
      { key: 'endDate', label: '结束日期', type: 'date' }, { key: 'description', label: '研究内容', type: 'textarea' },
      { key: 'achievements', label: '研究成果', type: 'textarea' }
    ]
  },
  publications: {
    label: '论文与成果',
    fields: [
      { key: 'title', label: '标题' }, { key: 'venue', label: '期刊／会议' },
      { key: 'date', label: '发表日期', type: 'date' }, { key: 'role', label: '作者顺序／贡献' },
      { key: 'status', label: '发表状态' }, { key: 'description', label: '说明', type: 'textarea' }
    ]
  },
  awards: {
    label: '竞赛与获奖',
    fields: [
      { key: 'awardName', label: '奖项／竞赛名称' }, { key: 'level', label: '级别／等级', choiceKey: 'awardLevel' },
      { key: 'date', label: '获奖日期', type: 'date' }, { key: 'organization', label: '颁发机构' },
      { key: 'description', label: '说明', type: 'textarea' }
    ]
  }
} satisfies Record<string, CollectionSchema>;

export type CollectionKey = keyof typeof COLLECTION_SCHEMAS;
