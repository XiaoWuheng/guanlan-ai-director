# 成熟开源项目借鉴与观澜适配

GitHub 项目无法穷尽。这里按观澜现有的「个人创作、拉片学习、逐镜导演、助手和开源发布」五个任务筛选，并以减少操作步骤、增加可核对证据、不增加主界面复杂度为采用条件。链接指向项目自己的仓库或文档；本清单是设计研究，不代表安装这些项目。

| 项目 | 可借鉴的已公开设计 | 本轮观澜落地 | 不照搬的边界 |
|---|---|---|---|
| [PySceneDetect](https://github.com/Breakthrough/PySceneDetect) | [AdaptiveDetector](https://www.scenedetect.com/docs/latest/api/detectors.html#scenedetect.detectors.adaptive_detector.AdaptiveDetector) 用相邻画面变化的局部关系辅助识别切点。 | `src/shot-detection.js` 独立实现邻近采样峰值判断；工作区和导出结果展示采样间隔、候选切点、低可信度位置。 | 观澜没有调用或复制该库；当前是稀疏采样，不宣称逐帧精度。 |
| [ComfyUI](https://github.com/Comfy-Org/ComfyUI) | 将耗时生成视为有状态的任务，便于查看进度与结果；画布可帮助理解创作内容之间的关系。 | 拉片和生视频任务保留可恢复状态；独立画布默认空白，可按需放入镜头提示词、资产、文字和生视频节点，连接上游后合成提示词并提交文生视频任务。 | 没有复制该项目的通用节点执行器；目前只有受控的视频生成节点，画布仍随观澜项目保存。 |
| [auto-editor](https://github.com/WyattBlue/auto-editor) | 将声音、运动等不同线索用于视频自动编辑。 | 作为下一步验证方向：若要把“候选切点”升级为更准确的拉片，需要先建立含运动、转场和音频的样本集。 | 本轮模型只看每镜两张静帧，不能声称检测了音频节奏或完整人物动作；也不自动剪掉内容。 |
| [libtv-skills](https://github.com/libtv-labs/libtv-skills) | 把创作能力写成可独立理解和复用的技能说明。 | 澜芯保持受控动作边界；明确的一键拉片与继续拉片指令只打开现有确认流程。 | 技能文本不会执行任意脚本，项目资料也不会被技能隐式改写。 |
| [LosslessCut](https://github.com/mifi/lossless-cut) | [逐段导航快捷键](https://github.com/mifi/lossless-cut/blob/master/src/main/configStore.ts)让用户不用反复点时间轴找片段。 | 拉片笔记区加入上一镜、下一镜、下一待记录，Alt+↑/↓ 可逐镜跳转；输入文字时快捷键不抢焦点。 | 不引入完整剪辑时间轴，也不假称提供无损剪辑。 |
| [Subtitle Edit](https://github.com/SubtitleEdit/subtitleedit) | [画面、字幕和声波对照](https://github.com/SubtitleEdit/subtitleedit/blob/main/docs/overview.md)能帮助精确核对时间。 | 保留为下一阶段候选：优先验证字幕或语音转录是否能真正减少人工听辨。 | 当前静帧 AI 拉片没有读取音轨；直接内置转录模型会显著增大包体与首次使用门槛。 |
| [OpenTimelineIO](https://github.com/AcademySoftwareFoundation/OpenTimelineIO) | 用可交换的结构表达镜头与剪辑信息。 | 作为导出互操作性候选，先用真实外部剪辑软件样本验证时间码与素材关联。 | 观澜目前不负责剪辑成片，不为形式上的“专业”引入复杂轨道模型。 |
| [whisper.cpp](https://github.com/ggml-org/whisper.cpp) | 本机语音转录可形成带时间段的台词证据。 | 与 Subtitle Edit 一起列入音频证据试验，不进入默认启动链路。 | 模型文件、语言准确率和硬件性能需先评估；不能承诺离线包换机即有高质量转录。 |
| [yt-dlp](https://github.com/yt-dlp/yt-dlp) | 获取公开视频的成熟解析能力。 | 已内置于便携包，链接拉片不要求用户另装 Python 或手动配置 PATH。 | 站点规则、权限和登录限制仍适用；观澜只处理用户可合法获取的片源。 |

下一步采用门槛：先用 10 段不同类型短片验证收益，测量从导入到首份可核对笔记的时间、错误切点的回看次数和用户需要手动修正的字段数。只有明确减少其中一项、且不让默认界面多出新步骤的能力才进入主流程。

这份清单记录设计借鉴，不表示这些项目都是观澜的运行依赖。观澜当前内置的视频链接解析器是 yt-dlp 与 FFmpeg，详见 [AI 能力边界](AI_CAPABILITIES.md) 与仓库中的第三方许可文件。
