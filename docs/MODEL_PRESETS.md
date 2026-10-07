# 模型预设与真实连接（核对日期：2026-10-07）

观澜把模型分成两类，不能混用：

| 类型 | 在观澜中能做什么 | 当前范围 |
| --- | --- | --- |
| 已接通的生视频连接 | 提交单镜/画布任务、查进度、下载结果 | 火山方舟 Seedance 2.5、2.0、2.0 Fast、2.0 Mini；需自己的密钥、模型权限和额度 |
| 视频交付预设 | 按目标模型的已核实规格检查画幅/时长，整理逐镜提示词 | MiniMax H3、Wan 3.0/Prime、Grok Imagine Video 1.5/旧版、可灵、Runway、Veo、Vidu、Luma、Firefly、PixVerse、Pika、海螺、本地开源模型等；不会从观澜调用这些服务 |

项目设置中的“目标视频模型”用于提示词和交付适配；镜头工作区的“生视频连接”用于实际提交。两者分开保存。选用 Seedance 交付目标后，还需在生视频连接中选同系列的 Model ID。不同账号、地区、生成模式的可用时长和分辨率可能不同，提交前以服务商控制台为准。

| 火山方舟预设 | Model ID | 本工作台开放的时长/分辨率 |
| --- | --- | --- |
| Seedance 2.5 | `doubao-seedance-2-5-260628` | 4–30 秒；480p / 720p / 1080p |
| Seedance 2.0 | `doubao-seedance-2-0-260128` | 4–15 秒；480p / 720p / 1080p / 4K |
| Seedance 2.0 Fast | `doubao-seedance-2-0-fast-260128` | 4–15 秒；480p / 720p |
| Seedance 2.0 Mini | `doubao-seedance-2-0-mini-260615` | 4–15 秒；480p / 720p |

以上型号及能力参照[火山方舟官方模型表](https://docs.volcengine.com/docs/ark/seedance-2-5)。Wan 3.0/Prime 的交付目标参照[阿里云官方文档](https://docs.modelstudio.console.alibabacloud.com/en/model-studio/wan3-video-generation-guide)；Grok Imagine Video 1.5 参照[xAI 官方视频 API 文档](https://docs.x.ai/developers/model-capabilities/video/generation)；MiniMax H3 参照[MiniMax 官方发布](https://www.minimax.io/news/minimax-h3-open-source)。这些交付目标不意味着已连通相应 API。

“MiniMax S3”按创作者提供的名称列为**待核实交付目标**。目前未找到可核对的官方视频模型 ID 或能力表，因此观澜不预填时长/画幅、不将其当作 H3，也不能直接提交。若官方后续公布型号和接口，应以其文档更新预设。

文字和图片模型有独立的连接预设，在“模型中心”选择，仍需个人密钥与权限。模型市场持续变化，观澜保留“其他 / 自定义模型”入口；目录是维护过的常用预设，不承诺覆盖所有在售、内测、区域限定或私有模型，也不随软件分发任何模型权重。
