# Career OS Demo · 桌面 App + 浏览器填充插件

在一个地方维护真实资料，用于校招投递和夏令营／学校申请。**资料只在桌面 App 编辑，Chrome 插件只读取、匹配、预览和填写。** 求职版与学术版共用个人信息和经历，不需要填写两份。

0.5.0 是 Windows / macOS 源码 Demo：下载到本地、安装依赖后运行。桌面外壳使用 Electron，本地服务随 App 启动和退出；无需单独启动服务，也没有另一个浏览器资料工作台。正式安装包、自动更新和商店发布将在后续提供。

> macOS Apple Silicon 已完成本地启动验证。Windows 和 Intel Mac 已提供跨平台代码及启动流程，但尚未完成真机验收；仓库包含 Windows / macOS GitHub Actions 检查，上传后可查看实际结果。不要把“提供跨平台实现”理解为全部平台验收通过。

## 1. 首次准备

| 依赖 | Windows | macOS |
| --- | --- | --- |
| 系统 | 建议 Windows 11 x64；其他版本未验收 | 建议 macOS 14+；Apple Silicon 已验证，Intel 待验收 |
| 浏览器 | 当前稳定版 Google Chrome | 当前稳定版 Google Chrome |
| Node.js | 安装 [Node.js 24 LTS](https://nodejs.org/en/download) | 同左 |
| Python | 安装 [Python 3.12](https://www.python.org/downloads/)；勾选 **Add python.exe to PATH** | 从官网安装 Python 3.12，不依赖系统自带的旧 Python |
| PDF 依赖 | 完整版 [TeX Live](https://tug.org/texlive/windows.html) | 完整版 [MacTeX](https://tug.org/mactex/) |

Node.js 最低 22.13，Python 最低 3.11，推荐 Node.js 24 + Python 3.12。首次安装需要联网下载 npm、Python 和 Electron 依赖；安装后，资料维护、规则匹配和 PDF 生成在本地运行。官网投递和可选 AI 功能需要网络。

**完整体验包含 PDF，因此请安装 TeX 依赖。** 跳过 TeX 仍能维护资料、生成文字草稿和填表，但无法导出 PDF。TeX 体积较大，安装完成后重新打开终端；完整版包含 XeLaTeX、ctex、Fandol、geometry、enumitem 和 hyperref。见 [TeX Live 安装说明](https://tug.org/texlive/quickinstall.html)。

从仓库 Releases 下载 `Career-OS-demo-0.5.0.zip` 并解压；没有 Release 时，可用 GitHub **Code → Download ZIP**。把项目放在固定、可写的本地目录，不要在 ZIP 内运行。推荐 Windows `C:\CareerOS`，Mac `~/CareerOS`。插件会一直引用其中的 `chrome-mv3` 文件夹，后续不要随意移动目录。

## 2. 打开桌面 App

### 方式 A：启动脚本

- **Windows**：双击项目根目录 `Start Career OS.cmd`。
- **macOS**：终端进入项目目录，运行 `bash "Start Career OS.command"`。也可执行 `chmod +x "Start Career OS.command"` 后双击。

脚本首次运行会安装依赖、创建独立 Python 环境 `.demo-venv`、构建插件，再打开 App。首次下载可能需要数分钟，请保留终端窗口。后续运行会复用环境。失败时会保留错误提示，不要求用户输入数据库密钥。

若 macOS 拦截下载的启动文件，可使用上述终端命令运行源码；本 Demo 还不是签名、公证后的正式安装包。

### 方式 B：明确执行 Quick Start

安装依赖后重新打开终端，进入含 `package.json` 的目录。

Windows PowerShell：

```powershell
cd C:\CareerOS
node --version
py -3.12 --version
npm.cmd ci
npm.cmd run demo:setup
npm.cmd start
```

macOS Terminal：

```bash
cd ~/CareerOS
node --version
python3.12 --version
npm ci
npm run demo:setup
npm start
```

后续日常只需 `npm start` 或启动脚本。不要同时运行旧版 `Career OS.app`；同一电脑只运行一个 Career OS，本地端口为 `127.0.0.1:43119`。

检查 PDF：

```bash
npm run doctor -- --pdf
```

输出 `Chinese PDF: OK` 才表示中文 PDF 实际编译成功。检查使用临时示例，不读取个人资料。PowerShell 如提示执行策略限制，将 `npm` 改成 `npm.cmd`，无需更改系统执行策略。

## 3. 安装插件并配对

1. 保持 App 打开，在 Chrome 地址栏输入 `chrome://extensions`。
2. 打开右上角 **开发者模式** → **加载已解压的扩展程序**。
3. 选择项目内 **`chrome-mv3` 文件夹**，不是整个项目、ZIP 或 `entrypoints`。其中直接包含 `manifest.json`。
4. 在 Chrome 扩展菜单中固定 **Career OS · 简历秒填助手**。
5. App → **设置与备份** → **生成插件配对码** → 复制 8 位配对码。
6. 插件 → **连接设置** → 输入配对码并连接，确认显示“已连接”。

配对码有效期 5 分钟、仅使用一次，输错多次后需要重新生成。重启 App 通常不需要再次配对。插件保存本机只读凭据，不维护另一份可编辑简历；App 关闭时插件暂停读取，不使用过期副本填写。

## 4. 完整使用 SOP

### 维护唯一资料库

1. **我的资料**：填写个人信息，新增教育、实习、项目、科研、论文或获奖经历，再点击保存。
2. 学历与学位分别选择，例如“本科”和“学士”；插件按字段含义和同义词匹配网站中的“本科生”“学士学位”等选项。
3. 保存经历后，为该经历补充动作、结果、技术和证据链接，归属于同一份资料。
4. 左上角切换 **求职版 / 学术版**。基础信息和经历共用，申请偏好、机会和材料按场景展示。插件中的场景也请选择当前投递类型。

“已输入”不等于“已保存”。退出窗口时如存在未保存的资料或材料修改，App 会提示。

### 本地演练填表

1. 保持 App 打开，在 **Chrome** 访问 `http://127.0.0.1:43119/demo/form`。
2. 打开插件，选择场景 → **扫描当前页面**。
3. 核对字段来源和拟填值；有多个来源时手动选择，必要时定位到网页检查。
4. **确认填写** → 点击演练页“查看填写结果（不提交）”。

演练页不保存 SSoT、不提交申请。可先用虚构资料测试；资料库建立后直接在 App 修改，首次 JSON 导入不会覆盖已有资料。

### 企业／学校官网填写

1. Chrome 登录官网并打开实际申请表，用户自行完成短信验证码、图形验证和协议确认。
2. 插件扫描、核对后确认填写。已有网页值默认保留；缺资料、匹配不确定或控件不兼容的项手动补充。
3. 进入新的表单页或新增经历后重新扫描。桌面资料修改后也重新扫描；旧预览不会覆盖新版本。
4. 检查附件、必填项和网站提示，由用户点击官网最终提交按钮。

插件不保证所有网站字段自动填写。跨域 iframe、封闭 Shadow DOM、特殊联动控件等仍有适配边界。本地演练通过不代表所有公司／学校官网均已通过验收。

### 生成申请材料和 PDF

1. **申请机会**：填写机会名称、组织、岗位／学校要求并保存。
2. **选择相关事实**：勾选内容、调整顺序 → **根据所选事实生成简历草稿**。
3. **申请材料**：打开材料与来源，核对事实，按需编辑 → **保存改写并校验**。
4. 可选 AI：展开“用模型生成另一种表达”，填写自己的 HTTPS 接口地址、模型名和 API Key，点击授权生成。接口需兼容 Chat Completions；密钥不持久保存，费用由所用服务决定。不用 AI 也能完成本地草稿与 PDF 流程。
5. 勾选逐条核对 → **确认材料** → **编译并预览 PDF** → **保存当前 PDF**，在系统保存对话框选择位置。
6. 回官网手动上传导出的 PDF。

材料改写不反向修改真实资料。资料库更新后，旧材料提示来源过期，需要重新生成。当前提供个人资料 JSON 首次导入；PDF / DOCX 简历解析、飞书导入尚未迁入桌面端。

## 5. 数据、备份、更新与卸载

| 系统 | 默认个人数据目录 |
| --- | --- |
| Windows | `%LOCALAPPDATA%\Career OS\`，通常为 `C:\Users\用户名\AppData\Local\Career OS\` |
| macOS | `~/Library/Application Support/Career OS/` |

**设置与备份**可查看并打开目录。`career.db` 是唯一活动资料库，`assets` 为附件目录，`outputs` 保存 PDF / LaTeX，`config` 保存认证和迁移候选，`desktop-state` 保存界面状态，`desktop.log` 用于启动诊断。每位新用户获得自己的空库，发布包不携带作者资料。

- **JSON 导出**：包含资料、事实、机会和材料历史，不含 PDF 二进制及凭据。当前没有完整历史 JSON 一键恢复；首次个人资料 JSON 导入也不是完整备份恢复。
- **完整备份／恢复**：退出 App 后复制整个个人数据目录。恢复同版本备份时先保留当前目录副本，再恢复整个目录，可能需重新配对。不要在 App 运行时覆盖数据库。
- **更新 Demo**：退出并备份，下载新版本到固定项目目录，重新执行 `npm ci`、`npm run demo:setup`、`npm start`。Chrome 扩展管理页点“重新加载”，刷新已打开的申请页。换目录需从新路径加载插件，可能需重新配对。0.5 沿用 0.4 macOS 数据目录，不主动清空旧资料。
- **卸载**：退出 App，移除 Chrome 插件，删除项目目录。个人数据仍保留；确定不再需要时才手动删除个人数据目录。

不要向 GitHub 提交个人数据、凭据、API Key 或真实简历。SQLite 未加密；Windows 文件权限继承用户目录 ACL。详见 [PRIVACY.md](PRIVACY.md)。

## 6. 故障排查

| 现象 | 处理 |
| --- | --- |
| 找不到 node / npm / Python | 安装依赖后重开终端；Windows 确认 Python PATH 选项，Mac 用 Python 官网安装包 |
| Python 环境过旧／损坏 | 退出 App，仅删除项目内 `.demo-venv` 后运行 `npm run demo:setup`，勿删个人数据 |
| 首次 Electron / pip 下载失败 | 检查 npm、PyPI 和 Electron 下载源是否可达，修复网络后重试；不要跳过安装 |
| npm.ps1 被阻止 | 使用 `npm.cmd` 或双击 `.cmd` 启动脚本 |
| 端口 43119 被占用 | 退出旧 App 或之前启动的本地服务，不同时运行两个版本 |
| 插件无法连接 | 确认 App 打开、版本匹配，重新生成配对码；先用本地演练页排除官网问题 |
| 找不到 manifest.json | 执行 `npm run demo:setup`，在 Chrome 选择 `chrome-mv3` 文件夹 |
| Chrome 无法读取页面 | 使用普通 HTTP / HTTPS 表单页，不能扫描 Chrome 内部页；官网加载后刷新重试 |
| 未找到 XeLaTeX／中文编译失败 | 完成 TeX 完整安装，重开终端和 App，运行 `npm run doctor -- --pdf` |
| Windows 安装 TeX 后仍找不到 | `where.exe xelatex` 检查 PATH，确保 TeX Live 的 `bin\windows` 加入用户 PATH，重开终端 |
| 需要更多诊断 | `npm run doctor`，查看 `desktop.log`；反馈系统、版本和脱敏错误，不公开资料库或凭据 |

## 7. 开发验证和 GitHub 发布

```bash
npm run compile
npm test
npm run test:service
npm run test:desktop
npm run doctor -- --pdf
npm run demo:pack
```

`test:desktop` 用临时目录和随机端口验证真实 Electron 页面加载、配对只读权限、退出后服务停止，不读取现有资料。没有 XeLaTeX 时，服务测试中的真实 PDF 用例会跳过；`doctor -- --pdf` 则明确失败，不能据此宣称 PDF 已验证。

`demo:pack` 在 `release/` 生成白名单源码 ZIP、文件清单和 SHA256，包含预构建插件；排除虚拟环境、node_modules、原始采集记录、归档和个人数据。上传步骤见 [GitHub 发布 SOP](docs/RELEASING.md)。应上传干净包中的内容，不要在开发目录直接 `git add .`。

技术上复用现有本地 API 和字段 schema，通过 Electron 的[隔离 preload 桥接](https://www.electronjs.org/docs/latest/tutorial/context-isolation)提供桌面操作。旧 Mac 原生源码保留供开发参考；Demo 用户无需 Swift / Xcode / PyInstaller，不必执行 `desktop:build`。

实现与验证边界见 [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)。
