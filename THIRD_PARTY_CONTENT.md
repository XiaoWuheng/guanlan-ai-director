# 内容与授权清单

公开源码采用 MIT 许可，仅适用于仓库中由项目贡献者有权许可的代码、文档与原创资源。用户在本机导入的剧本、课程、图片、视频、技能和模型服务不因此获得 MIT 许可。

| 类别 | 当前处理 | 公开前核对 |
|---|---|---|
| `src/builtin-knowledge.json`、`src/builtin-course.json` | 保留在本机；Git 忽略且公开构建排除 | 确认所有内容来源与可再分发权限后，才考虑单独公开 |
| `src/private-feedback.json` | 本机反馈邮箱配置；Git 忽略且公开构建排除 | 公开版使用复制与导出反馈，不内置私人地址 |
| `branding/` 与旧版本文档 | 保留在本机，不进入公开仓库 | 逐项核对图片、字体和引用来源 |
| `src/assets/brand/` | 观澜当前品牌资源 | 发布前复核原始文件与导出文件是否均为项目原创 |
| `src/assets/brand/guanlan-boot-wordmark.svg` | 片头字标取自 Noto Serif CJK SC 的「观澜」字形轮廓，经裁切与双色片头排版使用；原字体 © 2017–2023 Adobe，按 SIL Open Font License 1.1 授权；许可证见 `src/assets/brand/OFL-Noto-CJK.txt` | 字形衍生资源依 OFL 1.1 分发，不按本项目 MIT 许可重新授权 |
| `src/assets/boot/*.webp` | 使用内置图像生成工具为观澜创作的三张原创片头画面，原始 PNG 留在本机 `branding/boot-originals/` | 公开前复核画面内容、生成来源记录和可分发范围 |
| 运行时由用户导入的技能与媒体 | 保存在用户资料目录 | 不加入仓库；分享时由用户确认权利 |
| npm 依赖 | 由各上游包分别授权 | 发布时保留锁文件并核对依赖许可证 |
| 随便携包分发的 yt-dlp 2026.07.04 | 独立进程解析公开视频分享页；程序、Unlicense 文本及其第三方许可文本单独置于 `runtime/` | 官方 Windows 可执行文件的组合许可为 GPLv3+；观澜应用代码仍按其自身许可发布。来源、校验值见 `vendor/README.md` |
| 随便携包分发的 FFmpeg LGPL 共享构建 | 供 yt-dlp 合并公开视频流；`ffmpeg.exe`、`ffprobe.exe` 与依赖 DLL、许可及源码链接单独置于 `runtime/ffmpeg/` | 构建版本和源码位置见 `runtime/ffmpeg/NOTICE.txt`；不将其声明为观澜 MIT 代码 |

本清单记录**待核对项**，不是对第三方素材权利的保证。若不能确认来源或再分发许可，公开版本继续排除相应文件。
