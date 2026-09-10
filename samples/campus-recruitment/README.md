# 校招官网表单样本库

本目录保存官网实际观察到的**表单结构**，不保存候选人资料、输入值、附件内容、账号、验证码、Cookie 或令牌。与浏览器 `chrome.storage.local` 中的个人资料分开管理。

- `companies/`：每家公司独立 JSON；包含入口、实际表单 URL、采集范围、字段、限制、内部资料路径及待验证事项。
- `evidence/`：从页面标签与控件属性整理的匿名观察记录。它们不是原始 HTML，也不含填写值。
- `field-catalog.json`：按资料路径归并的字段目录、标签和来源，不含资料值。
- `pending-sites.json`：未取得表单的网站、原因和后续动作。
- `manifest.json`：全体目标站点及采集／登录阻塞状态。
- `coverage.md`：实际采集覆盖及本地资料结构缺口。

## 证据与状态

`observed_form` 表示已实际读取表单；`partial` 表示当前展开的字段已采集，条件分支、异步选项或后续步骤仍待采集。`login_required`、`captcha_required`、`access_blocked`、`page_unavailable` 均不能算已采集简历。空字段列表是未取得证据，不能用通用模板补造。

`required: null` 表示未确认；`options: []` 配合 `optionsStatus: not_observed` 表示未展开选项，不等于没有选项。文本长度仅按真实 DOM 属性或页面明确提示记录。字段路径是人工语义标注，`mappingStatus: custom_proposed` 表示本地尚无专门 UI；不是已经验证自动填写成功。

这是观察资料格式，不是运行时 `FieldDescriptor`：允许未知必填值 `null` 和尚未归类的 `kind: custom`；`date` 表示日期语义，也可能由多个文本框组成。`options[].value` 仅复制显示标签并标为 `label_only_not_dom_value`，不能直接当作网站内部枚举值。`answerable` 只表示存在建议资料路径，不能推断用户已有答案；`requiresGeneration: false` 表示本批未标注生成需求。

数组索引仅用于示例记录，填表前必须按教育层次、实习／工作类型选择记录。未生成回归 fixture，也未验证官网自动填写成功。样本不导入个人资料，避免用空模板覆盖真实简历。

## 继续采集

1. 在对应官网进入“我的简历／编辑”，登录或验证码由用户协作完成。
2. 仅读取标签、placeholder、必填标记、控件类型、选项和校验提示。展开可撤销的空经历区块后读取，结束时取消；不保存、上传或投递。
3. 用现有插件“扫描当前表单 → 导出样本”获取机器扫描结果；保存前检查 URL 查询参数、上下文和选项，避免把已填个人信息带入样本。不要直接保存整页 HTML、截图或 DOM 快照。
4. 将新的匿名观察写入 `evidence/`，执行 `node scripts/build-campus-samples.mjs` 更新公司 JSON、manifest 和字段目录。实际下拉框需展开后才可确认选项；联动分支单独记录触发条件。
5. 执行 `node scripts/validate-campus-samples.mjs`。合成 fixture 只能验证本地解析，不能作为官网兼容性通过的证据。

本批只覆盖校招（含官网共用的实习简历），保研数据后续另建目录。
