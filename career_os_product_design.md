# 职业信息工作台 / Career OS 产品设计方案

## 1. 产品概述

### 1.1 一句话定义

这是一个以用户职业事实库为 **Single Source of Truth（SSOT）** 的个人职业信息工作台：用户只维护一份真实、完整、结构化的职业信息，系统负责根据不同岗位、不同场景和不同受众完成信息选择、表达适配与自动交付。

核心理念：

> **用户负责维护真实的自己，AI 负责理解和表达自己，工具负责把表达送到正确的地方。**

进一步抽象：

> **真实的你只有一份，表达可以有很多种。**

英文可以概括为：

> **Your career has one truth, but many expressions.**

---

## 2. 设计动机

### 2.1 表层痛点：重复填写简历信息

传统求职流程中，用户会反复进行以下工作：

- 在不同招聘网站填写姓名、学校、学历、实习、项目、技能等信息；
- 在 Overleaf / Word / Typst / LaTeX 中维护 PDF 简历；
- 针对不同 JD 修改简历内容；
- 准备不同版本的自我介绍；
- 在 Boss、LinkedIn、公司官网等渠道重复维护个人信息；
- 面试前重新回忆某段经历的背景、动作、结果和技术细节。

如果只从这一层看，问题似乎只是“填表太麻烦”。

但这只是表象。

### 2.2 更本质的问题：职业信息被分散维护

一个人的经历本质上只有一份，但现实中却被拆散在很多地方：

```text
Overleaf
招聘网站 A
招聘网站 B
Boss / LinkedIn
个人笔记
项目文档
自我介绍
面试题库
```

同一个事实会被重复录入、重复修改、重复润色。

这带来三个问题：

1. **重复劳动**  
   同一份信息需要在多个地方反复维护。

2. **版本漂移**  
   一个地方更新了，另一个地方没有更新，最终出现多个相互不一致的版本。

3. **上下文丢失**  
   简历只保留了最终的几条 bullet，但项目背景、决策过程、失败尝试、指标细节、证据材料往往没有被系统化保存。

### 2.3 第一性原理：事实只有一个，表达可以有很多个

求职时真正存在一个“变与不变”的结构。

不变的是：

- 学校；
- 公司；
- 项目；
- 时间；
- 使用过的技术；
- 做过的事情；
- 真实指标；
- 论文、奖项、证书；
- 事实性的项目结果。

这些构成用户的 **职业事实层**。

变化的是：

- 对某个 JD 应该突出哪段经历；
- 某段经历应该写长还是写短；
- 应该强调技术、业务还是研究；
- 如何组织自我介绍；
- 面试时应该从哪个角度介绍某个项目；
- 哪些内容应该进入 PDF 简历；
- 哪些字段应该自动填写到网页。

因此产品不应该让用户维护很多份“简历”，而应该让用户维护一份真实职业数据，再按需生成不同表达。

---

## 3. 产品定位

### 3.1 不是什么

这个产品不是：

- 一个普通的自动填表插件；
- 一个 AI 简历生成器；
- 一个 Overleaf 替代品；
- 一个 JD 关键词匹配器。

这些都只是它的局部能力。

### 3.2 是什么

更准确的定位是：

> **个人职业信息基础设施 / Career Information Infrastructure**

它把“个人经历”从一个静态 PDF 文件，转化成一份持续更新、结构化、可调用、可验证的职业数据资产。

简历不再是源文件，而只是一个输出视图。

网页表单也不再是用户需要维护的地方，而只是另一个输出渠道。

最终形成：

```text
一份真实职业数据
        ↓
   多种场景表达
        ↓
多种交付与执行方式
```

---

## 4. 核心产品原则

### 4.1 Single Truth

用户只维护一份职业事实数据。

所有后续简历、网页表单、自我介绍、面试材料都从这份数据生成。

### 4.2 Multiple Views

面对不同岗位、不同对象和不同场景，可以从同一份事实中选择不同侧面进行表达。

同一个项目可以有：

- 简历版；
- 面试版；
- 100 字版；
- 50 字版；
- 技术导向版；
- 业务导向版；
- 研究导向版。

### 4.3 Zero Repetition

用户不应该再次手动输入系统已经知道的信息。

如果某个招聘网站要求填写“学校”，系统应直接读取事实库。

如果某个 JD 需要突出“时间序列”，系统应从事实库中召回相关经历，而不是让用户重新整理。

### 4.4 Fact Grounding

AI 可以改变：

- 顺序；
- 结构；
- 语气；
- 长度；
- 强调重点。

但 AI 不允许改变：

- 数字；
- 时间；
- 公司；
- 项目；
- 技术事实；
- 真实结果；
- 因果关系。

核心规则：

> **AI 可以改变怎么说，不能改变发生了什么。**

---

# 5. 四层产品架构

整个产品可以分为四层：

```text
Fact Layer
    ↓
Memory Layer
    ↓
Expression Layer
    ↓
Action Layer
```

或者：

```text
事实
 ↓
理解
 ↓
表达
 ↓
执行
```

---

## 6. 第一层：事实层 Fact Layer

### 6.1 职责

事实层负责回答：

> **我真实做过什么？**

它是整个系统的唯一可信数据源。

主要由用户维护，AI 不应该拥有直接改写权限。

### 6.2 事实层应该保存什么

包括但不限于：

- 基础身份信息；
- 教育经历；
- 工作 / 实习经历；
- 项目经历；
- 论文；
- 奖项；
- 技能；
- 证书；
- 开源项目；
- 项目结果；
- 真实指标；
- 技术栈；
- 业务背景；
- 项目角色；
- 项目中的动作；
- 支撑材料；
- 证据链接。

### 6.3 不应该直接保存“简历 bullet”

例如不应该把下面这句话作为唯一事实：

> 构建基于扩散模型的三阶段分层 LTV 预测框架，为 UA 投放提供量化支持。

因为这已经是加工后的表达。

更合理的存储方式是拆成原子事实：

```yaml
experience:
  company: 腾讯
  role: 数据科学实习生
  start_date: 2026-05

project:
  name: IAA 游戏 LTV 预测

context:
  business_problem:
    - 新上线 IAA 游戏长期 LTV 难以直接观测
    - 需要支持 UA 投放回收周期判断

actions:
  - 构建留存率预测模块
  - 构建 ARPDAU 预测模块
  - 设计三阶段分层预测框架
  - 使用扩散模型预测长期时间序列
  - 与传统曲线外推方法进行回测比较

results:
  - 多项回测指标最优

technologies:
  - Python
  - PyTorch
  - Diffusion Model

evidence:
  - experiment_report_001
```

### 6.4 推荐的数据抽象

建议使用：

```text
Experience
    ↓
Project
    ↓
Fact / Event
    ↓
Evidence
```

例如：

```text
腾讯
 ↓
IAA LTV Prediction
 ↓
构建三阶段扩散模型
 ↓
实验报告 / 指标结果 / Repo / 文档
```

这样可以建立：

```text
事实 → 能力 → 证据
```

为后续 JD 匹配、面试准备和事实校验提供基础。

---

# 7. 第二层：记忆层 Memory Layer

### 7.1 职责

记忆层负责回答：

> **这些经历之间是什么关系？它们共同说明了什么？**

这一层允许 AI 介入，但它不是用来“写漂亮文案”的。

它主要做组织、关联和理解。

### 7.2 时间线

根据经历时间构建：

```text
本科统计学
    ↓
时间序列科研
    ↓
扩散模型论文
    ↓
腾讯 LTV 时序预测
    ↓
ML / Time Series Career Path
```

让用户看到职业发展的纵向轨迹。

### 7.3 经历关系图

识别经历之间的关联：

```text
论文研究
  ↓
扩散模型经验
  ↓
LTV 时序预测
```

或者：

```text
内容安全
  ↓
策略分析
  ↓
数据科学
```

### 7.4 能力图谱 Capability Graph

每一项经历可以被映射为能力：

```text
Time Series
├── ICLR 论文
├── 腾讯 LTV
└── 本科项目

PyTorch
├── 腾讯 LTV
└── 科研项目

Business Analysis
├── 字节策略分析
└── 腾讯 UA / LTV

LLM
└── 莉莉丝风控
```

这部分将来可以直接支持岗位匹配。

### 7.5 Career Inbox

这是一个值得加入的扩展功能。

现实中用户不会在每次做完项目后马上修改简历，因此可以增加一个低成本入口：

```text
Career Inbox
```

用户随手记录：

- “今天完成了 LTV 模型回测”
- “新实验 MAPE 更低”
- “上线了一个新策略”
- “写完一篇论文”
- “拿到一个奖项”

AI 帮助将零散信息整理为：

```text
Project
Fact
Metric
Skill
Evidence
```

用户确认后进入事实库。

这样解决的是：

> 职业经历如何在发生时被沉淀，而不是半年后重新回忆。

---

# 8. 第三层：表达层 Expression Layer

### 8.1 职责

表达层负责回答：

> **面对这个对象，我应该展示自己的哪一面？**

这一层由 AI 主导。

但 AI 不是自由生成，而是在严格事实约束下做：

- 选择；
- 排序；
- 重组；
- 压缩；
- 润色；
- 风格适配。

### 8.2 主要输出

包括：

- JD 定制简历；
- 自我介绍；
- 项目介绍；
- Cover Letter；
- 招聘平台个人简介；
- 面试答案；
- STAR 版本；
- 技术版项目介绍；
- 业务版项目介绍；
- 长版 / 短版经历描述。

### 8.3 不使用“大 Prompt 一次生成”

不建议：

```text
这是我的简历
这是 JD
帮我改一下
```

建议采用 Pipeline：

```text
JD
 ↓
JD Parser
 ↓
Requirement Extraction
 ↓
Fact Retrieval
 ↓
Fact Ranking
 ↓
Resume Planner
 ↓
Resume Writer
 ↓
Fact Validator
 ↓
Style Validator
 ↓
Final Output
```

---

# 9. JD 适配 Pipeline

## 9.1 JD Parser

把自然语言 JD 转成结构化要求。

例如：

```json
{
  "role": "Machine Learning Engineer",
  "core_skills": [
    "PyTorch",
    "Time Series"
  ],
  "secondary_skills": [
    "LLM"
  ],
  "business_focus": [
    "modeling",
    "deployment"
  ],
  "preferred_background": [
    "research",
    "large-scale ML"
  ]
}
```

## 9.2 Fact Retrieval

从事实库中召回与 JD 最相关的事实。

例如：

```text
Time Series
★★★★★ ICLR 论文
★★★★★ 腾讯 LTV
★★★ 本科项目

LLM
★★★★ 莉莉丝风控

PyTorch
★★★★★ 腾讯 LTV
★★★★★ 科研项目
```

## 9.3 Fact Ranking

不仅判断“是否相关”，还要判断：

- 重要程度；
- 可信程度；
- 可量化程度；
- 区分度；
- 与岗位核心要求的匹配度。

## 9.4 Resume Planner

先决定“写什么”，再决定“怎么写”。

输出类似：

```json
{
  "section_order": [
    "education",
    "research",
    "experience",
    "projects"
  ],
  "selected_experiences": [
    "exp_tencent_ltv",
    "paper_iclr",
    "exp_lilith_llm"
  ],
  "emphasis": {
    "exp_tencent_ltv": ["time_series", "pytorch", "modeling"],
    "paper_iclr": ["research", "generative_model"]
  }
}
```

## 9.5 Resume Writer

再根据 planner 生成具体文本。

## 9.6 Fact Validator

校验生成文本中的事实是否全部有来源。

例如 AI 生成：

> 提升预测准确率 25%

如果事实库不存在 `25%`，则直接拒绝。

---

# 10. AI 防跑偏机制

用户最核心的风险之一，是 AI 生成了“看起来厉害但本人讲不出来”的内容。

因此产品必须在架构上控制幻觉，而不是只靠 Prompt 提醒。

### 10.1 每条输出保留 Source Fact

例如：

```json
{
  "text": "构建三阶段扩散模型进行长期 LTV 预测",
  "source_facts": [
    "fact_102",
    "fact_108"
  ]
}
```

### 10.2 事实级限制

建议规则：

```text
数字：
必须来自事实库

公司 / 学校 / 项目：
必须来自事实库

技术：
必须来自事实库

结果：
必须来自事实库

因果关系：
需要事实或证据支持

能力总结：
允许有限推断

措辞：
允许改写

结构：
允许调整

顺序：
允许调整
```

### 10.3 用户定义“表达上限”

可以允许用户对事实设置强度：

```text
Comfort Level
```

例如：

```text
熟练掌握
可以展开讲
只做过基础使用
仅了解
```

AI 在生成时不能超过用户设定的表达强度。

这样可以进一步解决“简历写太满、面试接不住”的问题。

---

# 11. Skill 设计

AI Skill 不应该只是一份 Prompt。

一个完整 Skill 建议包含：

```text
Task
Input Schema
Rules
Output Schema
Validator
```

例如：

## Resume Adaptation Skill

输入：

```text
JD
Candidate Facts
User Preferences
Resume Template
Target Length
Language
```

规则：

```text
禁止创造事实
禁止创造数字
优先选择 JD 高相关经历
每条 Bullet 控制长度
优先 Action + Method + Result
没有结果数据时禁止补结果
避免空洞形容词
突出岗位核心能力
```

输出：

```json
{
  "selected_experiences": [],
  "resume_sections": [],
  "fact_refs": [],
  "warnings": []
}
```

因此 Skill 本质上是：

> **Prompt + Schema + Constraints + Validator**

---

# 12. 第四层：交互层 Action Layer

### 12.1 职责

交互层负责：

> **把已经生成好的信息送到正确的位置。**

这一层尽量不做内容决策。

主要通过：

- Chrome Extension；
- Python；
- 本地 API；
- 自动化脚本；
- LaTeX 编译器。

完成。

---

# 13. Single Source of Truth 存储方案

## 13.1 不建议完全放在 Chrome 插件内

`chrome.storage.local` 更适合：

- 插件设置；
- 网站字段映射；
- 最近使用配置；
- UI 状态。

不适合作为整个 Career OS 的核心数据库。

因为未来数据消费者不只有浏览器：

```text
Chrome Plugin
Resume Engine
AI Engine
Interview Engine
Career Timeline
```

### 13.2 推荐架构

第一版建议：

```text
SQLite
+
本地文件目录
+
FastAPI Local Service
```

目录示例：

```text
career-os/
│
├── career.db
│
├── assets/
│   ├── certificates/
│   ├── papers/
│   └── projects/
│
├── templates/
│   ├── resume_cn.tex
│   └── resume_en.tex
│
├── outputs/
│   ├── ByteDance_DS.pdf
│   └── Tencent_MLE.pdf
│
├── skills/
│   ├── resume_adaptation/
│   ├── self_intro/
│   └── interview_story/
│
└── config/
```

本地启动：

```text
FastAPI
↓
http://127.0.0.1:<port>
```

Chrome 插件通过 API 访问事实库。

这样浏览器插件只是 Client，而不是数据中心。

---

# 14. 推荐技术框架

可以采用：

```text
Frontend / Workspace
React / Vue

Browser Extension
Chrome Extension Manifest V3

Local Backend
Python + FastAPI

Database
SQLite

ORM
SQLModel / SQLAlchemy

AI Layer
LLM API + Structured Output

Template Engine
Jinja2

Resume Engine
LaTeX + XeLaTeX / latexmk

Validation
Pydantic + Rule-based Validator

Optional Vector Retrieval
FAISS / SQLite Vector / Chroma
```

---

# 15. 浏览器插件模块

当前已有的自动填表功能可以继续保留。

推荐拆分：

```text
Extension
├── Page Detector
├── Form Scanner
├── Field Matcher
├── JD Extractor
├── Resume Controller
├── Upload Helper
└── Local API Client
```

## 15.1 Page Detector

识别当前页面是：

- Job Detail；
- Application Form；
- Resume Upload；
- 普通网页。

## 15.2 Form Scanner

扫描：

```html
input
select
textarea
contenteditable
```

以及：

- label；
- placeholder；
- aria-label；
- nearby text。

## 15.3 Field Matcher

将网页字段映射到 SSOT schema。

例如：

```text
“毕业院校”
“学校”
“University”
“College”
```

统一映射：

```text
education.school
```

## 15.4 JD Extractor

从页面提取：

- Job Title；
- Job Description；
- Requirements；
- Preferred Qualifications；
- Company；
- Location。

---

# 16. 简历生成系统

Overleaf 不应该再是必要依赖。

Overleaf 本质只是：

```text
LaTeX Editor
+
LaTeX Compiler
```

本地完全可以实现。

推荐流程：

```text
SSOT
 ↓
JD-specific Resume JSON
 ↓
LaTeX Template
 ↓
.tex
 ↓
latexmk / xelatex
 ↓
PDF
```

例如模板：

```latex
\Experience
{ {{ company }} }
{ {{ role }} }
{ {{ date }} }

{% for bullet in bullets %}
\item {{ bullet }}
{% endfor %}
```

Python 使用 Jinja2：

```text
Resume JSON
+
resume_template.tex
 ↓
render
 ↓
generated_resume.tex
```

然后：

```bash
latexmk -xelatex generated_resume.tex
```

输出：

```text
generated_resume.pdf
```

这样系统内部就是一个：

> **Resume Compiler**

用户不需要知道 LaTeX。

---

# 17. Resume Artifact 的数据结构

建议把每一份针对岗位生成的简历保存为独立 artifact，而不是覆盖 SSOT。

例如：

```json
{
  "resume_id": "resume_tiktok_mle_001",
  "job_id": "job_tiktok_mle",
  "created_at": "2026-09-10",
  "source_profile_version": "profile_v21",
  "sections": [],
  "fact_refs": [],
  "template": "resume_cn_v2",
  "status": "approved"
}
```

这样：

- SSOT 永远不被污染；
- 每份 JD 简历可以回溯；
- 可以重新编译；
- 可以比较版本；
- 可以检查某句话从哪里生成。

---

# 18. 自动上传 PDF

浏览器对 `<input type="file">` 有安全限制。

因此第一版不建议追求完全无感自动上传。

更合理的 UX 是：

```text
AI 生成简历
 ↓
编译 PDF
 ↓
插件提示：
“该岗位简历已准备好”
 ↓
用户预览 / 确认
 ↓
触发上传
```

如果后续追求更深层自动化，可以研究：

- Chrome Native Messaging；
- Playwright；
- Chrome DevTools Protocol；
- 本地 Companion App。

但这些方案都会显著增加权限、安装成本和安全风险。

因此 MVP 推荐保留一次用户确认。

---

# 19. Why Me 功能

对于每个 JD，除了生成简历，还可以生成：

```text
Why Me
```

它不是用户最终投递的材料，而是系统帮助用户理解：

> **为什么自己适合这个岗位。**

示例：

```text
岗位：Machine Learning Engineer

核心要求：
Time Series
PyTorch
Production ML

你的匹配：

Time Series
→ ICLR 论文
→ 腾讯 LTV

PyTorch
→ LTV Forecasting

Business ML
→ UA / ROAS / LTV
```

然后总结：

```text
你的三个核心卖点：

1. 时间序列研究背景
2. 生成模型实践经验
3. 游戏业务数据科学经验
```

这个结果可以同时驱动：

- 简历；
- 自我介绍；
- Cover Letter；
- 面试准备。

本质上是在生成：

> **Job-specific Personal Narrative**

---

# 20. 工作台设计

当前如果工作台只是基础信息填写页面，未来可以升级为：

```text
My Profile
Career Memory
Applications
Automations
```

## 20.1 My Profile

维护真实职业数据。

展示：

```text
12 段经历
26 个事实
18 项能力
4 篇论文 / 奖项
```

## 20.2 Career Memory

展示：

- Career Timeline；
- Capability Graph；
- Experience Graph；
- Career Inbox。

## 20.3 Applications

每一个岗位保存为：

```text
Job
├── JD
├── Match Analysis
├── Why Me
├── Resume
├── Self Intro
└── Application Status
```

## 20.4 Automations

控制：

- 自动填表；
- 简历生成；
- PDF 编译；
- 网站字段映射；
- 用户确认规则。

---

# 21. 完整用户流程

## 21.1 第一次使用

```text
安装插件
 ↓
打开 Career Workspace
 ↓
填写基础信息
 ↓
填写教育经历
 ↓
填写实习 / 工作经历
 ↓
填写项目 / 论文 / 奖项
 ↓
建立 Career Source of Truth
```

## 21.2 日常维护

```text
完成新项目
 ↓
Career Inbox 记录
 ↓
AI 帮助结构化
 ↓
用户确认
 ↓
写入 SSOT
```

## 21.3 求职流程

```text
打开 JD
 ↓
插件提取 JD
 ↓
JD Parser
 ↓
Requirement Extraction
 ↓
Fact Retrieval
 ↓
Fact Ranking
 ↓
Why Me
 ↓
Resume Planner
 ↓
Resume Writer
 ↓
Fact Validator
 ↓
LaTeX Renderer
 ↓
PDF Compiler
 ↓
用户预览
 ↓
自动填表
 ↓
上传 PDF
 ↓
提交申请
```

---

# 22. 数据模型建议

一个初始 schema 可以包含：

```text
User
BasicInfo
Education
Experience
Project
Fact
Evidence
Skill
Publication
Award
Job
JobRequirement
ResumeArtifact
ExpressionArtifact
Application
```

核心关系：

```text
Experience
  └── Project
       └── Fact
            ├── Skill
            └── Evidence
```

岗位侧：

```text
Job
 └── JobRequirement
```

生成侧：

```text
JobRequirement
     +
Fact
     ↓
ExpressionArtifact
```

---

# 23. 核心 API 建议

本地 API 可以先设计为：

```text
GET    /profile
GET    /experiences
GET    /projects
GET    /facts

POST   /facts
PUT    /facts/{id}

POST   /jobs/parse
POST   /jobs/{id}/match

POST   /resume/plan
POST   /resume/generate
POST   /resume/validate
POST   /resume/compile

POST   /expression/self-intro
POST   /expression/interview-story
```

插件只需要访问这些 API。

---

# 24. MVP 开发顺序

当前已经实现：

```text
Chrome 自动识别表单
+
SSOT 基础信息自动填写
```

下一阶段不要同时做太多功能。

建议优先跑通：

> **SSOT → JD → 定制简历 → PDF → 填表**

具体顺序：

```text
1. 独立 SSOT
2. SQLite 数据结构
3. Local FastAPI
4. Chrome 插件改为读取 Local API
5. JD Extractor
6. JD Parser
7. Fact Retrieval
8. Resume Planner
9. Resume Adaptation Skill
10. Fact Validator
11. LaTeX Renderer
12. PDF Compiler
13. PDF Preview
14. Application Autofill
```

这一闭环成立后，再加入：

- Career Timeline；
- Capability Graph；
- Career Inbox；
- Why Me；
- Interview Assistant；
- Version Learning。

---

# 25. 推荐的产品边界

第一阶段不要做：

- 自动替用户做职业决策；
- 完全无人确认地投递；
- 自动修改 SSOT；
- 无证据地生成量化成绩；
- 过度复杂的知识图谱；
- 为了 AI 而 AI。

第一阶段应该坚持：

```text
事实由人确认
AI 负责组织和表达
脚本负责执行
关键投递动作由用户确认
```

---

# 26. 核心差异化

如果只看功能：

```text
自动填表
AI 改简历
生成 PDF
```

都不是非常独特。

真正有辨识度的是产品背后的数据模型：

### 26.1 Resume is not the source

传统逻辑：

```text
Resume
↓
复制到网站
```

新逻辑：

```text
Career Data
├── Resume
├── Website Form
├── Self Introduction
├── Interview Story
└── Profile
```

### 26.2 用户维护“自己”，而不是维护“文档”

用户不需要再考虑：

> “我是不是还要去 Overleaf 修改一次？”

因为 Overleaf / PDF 已经不再是数据源。

### 26.3 AI 的角色被限制在最擅长的部分

人：

```text
负责真实性
```

AI：

```text
负责理解、匹配、表达
```

脚本：

```text
负责重复执行
```

这是一个非常清晰的人机分工。

---

# 27. 最终 Storytelling

这个产品最适合讲的故事不是：

> “我做了一个浏览器插件，可以自动填写求职网站。”

而是：

> 求职过程中，我发现真正麻烦的并不是某一个表单，而是我们不断在不同平台、不同简历、不同岗位之间重复维护同一个自己。  
>   
> 但人的经历本质上只有一份。面对不同岗位，我们改变的并不是事实，而只是选择从不同角度展示自己。  
>   
> 因此我把职业信息拆成了两部分：一份永远可信的事实源，以及围绕不同场景动态生成的表达。用户只需要维护真实的自己，AI 负责理解和重组这些经历，工具负责把最终表达自动交付到简历、招聘网站和其他场景中。  
>   
> 最终，简历不再是一份需要维护的文件，而只是个人职业数据的一种视图。

可以进一步压缩为：

> **我不是在做一个自动填简历的插件，而是在尝试让“简历”从一个静态文件，变成一份持续生长的个人职业数据。**

---

# 28. 产品愿景

长期看，这个系统可以从“求职工具”继续演化为：

> **Personal Career OS**

它持续记录一个人的职业发展：

```text
经历发生
 ↓
事实沉淀
 ↓
能力形成
 ↓
职业记忆
 ↓
场景表达
 ↓
实际机会
```

此时 PDF 简历、浏览器表单、面试自我介绍都只是 Career OS 的不同接口。

最终用户真正维护的不是“简历”，而是：

> **自己完整、可信、持续生长的职业轨迹。**
