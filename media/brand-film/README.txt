X-lab AI《指数点亮》/ Potential, amplified.
制作日期：2026-10-08

成片
横版：1920 × 1080，16:9，45 秒，30 fps。
竖版：1080 × 1920，9:16，45 秒，30 fps。
两版均为 H.264 / AAC MP4，中英文重点文字，立体声背景音乐，无旁白。
横版采用并列与横向展开；竖版采用上下层次与依次聚焦。两版共用叙事、正式品牌素材、文案与音乐。

片尾二维码
https://github.com/X-lab2017/xlab-ai-brand
二维码对应品牌仓库首页，可获取资源并进入 Issues 提出反馈。

时间结构
00:00–00:05　指数点亮 / Potential, amplified.
00:05–00:12.5　一个新的指数 / A new exponent.
00:12.5–00:20　让 AI 成为认知升级的「指数」/ AI, the exponent of cognitive growth.
00:20–00:25　一套系统，多种表达 / One identity. Many expressions.
00:25–00:30　五种结构 · 四种配色 / 5 layouts. 4 colorways.
00:30–00:37.5　在每个场景，保持一致 / Consistent, wherever you are.
00:37.5–00:45　品牌定格、传播语与资源二维码。

音乐
96 BPM、D 大调的原创合成轻电子器乐。以柔和铺底、拨弦式音色、低音及轻节拍构成；没有人声、录音采样或第三方歌曲。
assets/music_master.wav 是成片使用的音乐母带；source/compose_music.py 保存可修改的合成与编曲过程。

素材与字体
正式 Logo 源于 X-lab2017/xlab-ai-brand 的 v1.0 标志系统。
动画保留正式图形、品牌色、完整比例及 AI 上标关系；通过显现、透明度和整组缩放形成动效。
source_manifest.json 记录原始文件路径和 SHA-256。
品牌许可说明沿用 assets/BRAND_NOTICE.md。
Source Han Sans SC 与 Noto Sans 用于新增文案；未修改字体文件。字体许可证位于 fonts/OFL.txt 和 fonts/NotoSans-OFL.txt。

制作文件
source/render.js：横竖版动画与 MP4 渲染。
source/bilingual_copy.json：主要双语文案与时间点。
source/compose_music.py：原创器乐编曲。
source/music_notes.json：音乐与时间结构。
source/quality_checks.json：视频参数、二维码与音频检查结果。
assets/：正式 SVG、动画分层、头像、二维码与音乐母带。
fonts/：制作字体及对应许可证。
posters/：横竖版片尾静帧，方便预览与复用。

重新生成成片
需要 Node.js、FFmpeg；在项目根目录执行 npm install。
npm run landscape
npm run portrait
npm run preview
输出会写入 output/ 与 previews/。可直接使用附带素材，无需重新获取品牌仓库。

调整音乐（可选）
Python 需要 numpy、scipy。运行 python3 source/compose_music.py 后，会生成 assets/music_raw.wav。
使用以下命令输出音乐母带，再重新渲染视频：
ffmpeg -y -i assets/music_raw.wav -af loudnorm=I=-17:TP=-1.5:LRA=7 -ar 48000 -c:a pcm_s16le assets/music_master.wav

重新准备品牌素材（可选）
需要本地品牌仓库及 Python 的 qrcode、zxing-cpp、Pillow。
将 XLAB_BRAND_REPO 环境变量设为品牌仓库路径，再运行 source/prepare_assets.py。
