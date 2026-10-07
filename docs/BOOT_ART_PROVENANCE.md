# 观澜片头画面来源与提示词

三张片头场景使用 Codex 内置 `image_gen` 从文字生成；没有上传第三方皮肤、角色或视频作为参考图。墨山采用用户在 0.11.2 选定的晨雾山水版本。画面只用于观澜自身片头，不代表与其他项目联名。原始 PNG 保存在本机被 Git 忽略的 `branding/boot-originals/`，应用内使用压缩后的 WebP。公开前仍需执行内容与再分发核对。

| 片头 | 应用内文件 | 画面用途 |
|---|---|---|
| 潮汐 | `src/assets/boot/tide.webp` | 海岸、镜环与潮涌 |
| 墨山 | `src/assets/boot/ink.webp` | 晨雾群山、青墨笔环与日出 |
| 星垣 | `src/assets/boot/stellar.webp` | 星轨、胶片轨道与导演视界 |

## 生成提示词

### 潮汐

> Use case: stylized-concept. Asset type: original cinematic opening background for the Guanlan AI director workstation desktop app, 16:9 widescreen landscape, no text, no logo, no UI. Create an arresting original anime-inspired cinematic concept illustration: a lone adult female film director seen three-quarter back standing on a dark shoreline, wearing a practical long midnight-blue coat and holding a small luminous director's viewfinder; a monumental translucent circular tidal lens rises behind her, ocean swells curl into abstract film-strip arcs, layered spray and atmospheric depth, moonlight breaking through the lens, precise dramatic lighting, rich deep navy and desaturated sea-blue palette with restrained pale-cyan highlights. Strong silhouette, sophisticated studio-quality 2.5D painted finish, detailed scenery and volumetric atmosphere, visual impact comparable to a premium game opening frame. Keep the central 30% relatively calm so the app's existing Guanlan logo and title can overlay legibly. Do not depict a whale, whale girl, mascot, existing character, weapons, or any existing brand imagery. No letters or typography.

### 墨山

> Use case: stylized-concept. Asset type: original cinematic opening background for the Guanlan AI director workstation desktop app, 16:9 widescreen landscape, no text, no logo, no UI. Create an arresting original anime-inspired cinematic concept illustration in the same visual family as a premium opening frame: a lone adult female film director seen three-quarter back on a high mountain overlook, practical long charcoal-and-deep-forest-green coat, holding a small director's viewfinder; gigantic layered ink-wash mountain ridges sweep through mist behind her, a monumental pale jade circular brushstroke portal frames a distant sunrise, drifting calligraphic ink trails and subtle film-strip geometry, dramatic depth, restrained dark pine green, ink black, muted pale jade and ivory palette. Sophisticated studio-quality 2.5D painted finish, detailed atmospheric environment, a strong silhouette at the left third and relatively calm center 30% so the app's existing Guanlan logo and title can overlay legibly. Original character and scene only. Do not depict a whale, whale girl, mascot, existing character, weapons, or any existing brand imagery. No letters or typography.

### 星垣

> Use case: stylized-concept. Asset type: original cinematic opening background for the Guanlan AI director workstation desktop app, 16:9 widescreen landscape, no text, no logo, no UI. Create an arresting original anime-inspired cinematic concept illustration in the same visual family as a premium opening frame: a lone adult female film director seen three-quarter back standing on a high observatory platform at the left third, wearing a practical long dark indigo coat and holding a small director's viewfinder; a monumental violet-blue planet-like cinematic aperture and interlocking orbital film frames dominate a vast night sky, sparse constellations connect like shot-planning paths, luminous distant stars and subtle atmospheric haze give enormous scale and depth. Rich midnight blue, muted violet, smoky charcoal, restrained silver-lavender highlights, dramatic backlighting, sophisticated 2.5D painted finish and crisp silhouette. Keep the central 30% relatively calm and somewhat dark so the existing Guanlan logo and title can overlay legibly. Original character and scene only. Do not depict a whale, whale girl, mascot, existing character, weapons, or existing brand imagery. No letters or typography.
