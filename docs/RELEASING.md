# GitHub Demo 发布 SOP

本阶段发布源码 Demo 和浏览器插件，一个 ZIP 适用于 Windows / macOS，运行时按系统安装 Electron 和 Python 依赖。

## 准备发布内容

完成 README 中的验证命令，再运行 `npm run demo:pack`。输出 `release/Career-OS-demo-0.5.0.zip` 和 `.zip.sha256`，ZIP 包含源码、使用 SOP、启动脚本、预构建插件和 `RELEASE_FILES.json` 文件校验清单。

打包使用白名单，不包含个人数据库、登录状态、原始采集记录、归档、开发缓存或认证文件。新增程序文件需纳入白名单；发布前仍需确认没有把真实资料写进测试或文档。

## 上传 GitHub

1. 创建目标仓库，选择公开或私有，并决定源码授权方式。本 Demo 不替作者默认授予开源许可证。
2. 把 ZIP **解压到新的空文件夹**，进入其中含 `package.json` 的目录。下面命令只在这个干净目录执行。
3. 安装 Git 后运行，将占位地址替换为实际仓库：

```bash
git init
git add .
git commit -m "Publish Career OS 0.5.0 source demo"
git branch -M main
git remote add origin https://github.com/YOUR-ACCOUNT/YOUR-REPO.git
git push -u origin main
```

4. 查看 **Actions → Desktop demo checks** 的 Windows / macOS 结果。未运行或失败时，不要声称两平台验收通过。
5. **Releases → Draft a new release**：创建 `v0.5.0` 标签，勾选 pre-release，附上 ZIP 和 SHA256，说明中链接 README 并保留平台验收、PDF 依赖说明。
6. 分享 Release 链接。用户按 README 启动 App、加载插件、配对，无需作者电脑在线。

CI 会在两种系统安装依赖、构建插件、运行前后端与桌面启动测试，并保存源码包构建产物。CI 默认不安装大型 TeX 发行版，真实 PDF 用例可能跳过；完整验收还需两平台实际安装 TeX 并执行 PDF 检查及官网填写。

## 试用验收

记录系统、CPU、Node / Python / Chrome 版本、Demo 版本，并检查：

- 全新目录依照 README 启动，资料库为空。
- App 保存个人信息和经历，重启后保留；求职／学术共用资料。
- 插件配对、本地演练姓名、学校、学历和学位填写正确。
- 至少一页真实官网表单，记录无法匹配的字段与控件类型。
- 生成材料、审阅、导出并打开中文 PDF。
- 文件选择与保存、复制配对码、打开数据目录正常。
- 关闭 App 后插件暂停，重新打开后恢复。
- 更新项目与插件后资料保留，必要时重新配对。

反馈不应附带真实简历、手机号、身份证、API Key、数据库或浏览器登录状态。

## 后续正式版本

完成验收后再做 Windows 安装程序与签名、Mac 签名／公证／DMG、运行时与 PDF 依赖内置、升级迁移及自动更新、Chrome 应用商店发布。源码 Demo 不自动安装到 Applications / Program Files。
