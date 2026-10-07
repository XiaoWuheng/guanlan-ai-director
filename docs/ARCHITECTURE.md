# 架构与数据边界

观澜是 Electron 桌面程序。`src/main.js` 管理窗口、文件对话框与受控 IPC；`src/preload.js` 只暴露固定通道；渲染层实现剧本、资产、分镜、工作台、拉片、工具和助手。项目资料存放于用户资料目录，媒体与项目状态分开保存。

## 当前模块

| 目录或文件 | 职责 |
|---|---|
| `src/creative.js`、`src/domain.js`、`src/director-workspace.js` | 业务规则、镜头状态与连续性校验 |
| `src/workstation-*`、`src/workspace-080.*` | 镜头工作台、参数草稿、成片检查 |
| `src/shot-canvas-ui.js`、`src/canvas-workflow.js`、`src/canvas-workflow-ui.js`、`src/canvas-media-ui.js` | 独立画布视图、项目内节点与连线；镜头/资产按需引用原项目，不复制内容，画布自由视频任务另存 |
| `src/video-generation.js`、`src/video-generation-ui.js` | 火山方舟单镜文字／可选首帧图生成适配、任务状态、下载和成片回填 |
| `src/film-*`、`src/study-*` | 拉片学习、报告和独立参考资料 |
| `src/assistant-*`、`src/skill-store.js` | 澜芯意图、有限动作、独立对话存储与文字型技能 |
| `src/global-library.js`、`src/global-library-ui.js`、`src/asset-library-ui.js` | 本机统一资产目录、个人资产与确认资产聚合；跨项目复用产生新身份和待复核状态 |
| `src/storage.js`、`src/data-location.js` | 项目存储、迁移、恢复与媒体资料 |
| `src/skin-*`、`src/personal-preferences.js` | 三主题、片头及个人偏好 |

## 扩展边界

目前仍存在按脚本加载顺序逐层包装 `act`、`render` 的历史实现。`src/actions.js` 已提供受控动作注册表，新增动作优先使用 `registerAction`，不要继续增加覆盖链。页面注册表和旧动作将分阶段迁移，不能一次改写项目数据格式。

导入的 SKILL.md 和参考文件是用户数据，不是系统指令。澜芯只执行程序明确允许的动作；第三方脚本不执行，未知动作不映射到 IPC。模型密钥只由主进程处理，不写入导出文件。

生视频连接单独保存在资料目录 `video-connection.json`，密钥由 Electron 系统密钥库加密；任务记录在 `video-jobs.json`，生成文件在 `generated-videos/`。项目只在人工选择“加入本镜成片检查”后保存结果引用和当次提示词快照。个人统一资产保存在 `global-library.json`，图片存于 `media/`，画布导入的音视频存于 `clips/`；三者都纳入资料目录迁移。提交请求没有自动重试；查询失败保留任务号供再次查询。

## 构建与发布

`npm run dist:portable` 是包含本机可用资料的个人构建；`npm run dist:public` 排除两份本机导演资料与私人反馈配置。公开源码也通过 `.gitignore` 排除这些文件。构建后运行 `npm run release:public-check` 核对实际包内容。若要发布公开包，仍需核对 `THIRD_PARTY_CONTENT.md` 的资源权属。
