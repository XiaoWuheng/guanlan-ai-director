# 随包运行组件

观澜便携版将视频分享页解析所需工具放在独立的 `runtime/` 目录，由应用以子进程调用。它们不是观澜的 MIT 授权代码。

- `yt-dlp.exe`：官方 `2026.07.04` Windows x64 独立版，来源 <https://github.com/yt-dlp/yt-dlp/releases/tag/2026.07.04>，SHA-256 `52fe3c26dcf71fbdc85b528589020bb0b8e383155cfa81b64dd447bbe35e24b8`，与官方 `SHA2-256SUMS` 一致。该组合可执行文件受 GPLv3+ 许可；随包保留 `yt-dlp-LICENSE` 和 `yt-dlp-THIRD_PARTY_LICENSES.txt`。源代码：<https://github.com/yt-dlp/yt-dlp/tree/2026.07.04>。
- `ffmpeg/`：BtbN 的 FFmpeg `n8.1.3-14-g330caae0c1-20261006` Windows x64 LGPL 共享构建，原始 ZIP 的 SHA-256 为 `1e6425b7ff240d2264ef81d37e667f398f9863c79c867ac836645df65044a14b`。保留 `ffmpeg.exe`、`ffprobe.exe`、运行所需 DLL、`LICENSE.txt`、`COPYING.GPLv3` 和 `NOTICE.txt`。源代码及构建脚本链接见 `ffmpeg/NOTICE.txt`。

打包时不要用本机 PATH 上的同名工具替换这些经过校验的文件。更新组件须同时更新来源、版本、校验值和许可证，再在无 Python、yt-dlp、FFmpeg 的干净 Windows 环境验证。
