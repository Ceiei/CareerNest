# 表单样本库

校招官网的匿名字段观察已整理至 [campus-recruitment](campus-recruitment/README.md)，查看 [覆盖报告](campus-recruitment/coverage.md) 和 [站点索引](campus-recruitment/manifest.json)。它们是人工整理的实际观察，尚未作为官网填写兼容性测试。保研表单后续单独采集。

在目标报名页面点击扩展的“扫描当前表单”，再点击“导出样本”。导出的 JSON 不包含网页已有值和个人资料值。

人工标注时，为每个字段补充：

- `expectedKey`：正确的内部资料路径
- `answerable`：是否能由固定资料回答
- `requiresGeneration`：是否属于开放文本
- `notes`：格式限制、联动或平台特殊行为

每次扩充别名、格式规则或站点适配器后，将样本转为测试 fixture，并同时报告覆盖率与准确率。优先保证准确率，再提升覆盖率。
