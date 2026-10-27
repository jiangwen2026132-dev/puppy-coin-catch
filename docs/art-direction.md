# v2.0 美术说明

本版采用软萌绘本风：柔软毛绒、自然表情、暖色光线和细腻笔触。六只宠物与篮筐一起绘制为完整角色，统一姿态、光源与材质，通过耳形、毛质、眼睛和花纹区分品种。

## 参考与素材来源

- [VS Code Pets](https://github.com/tonybaloney/vscode-pets)：研究角色轮廓、品种区分和动画表现。该项目代码使用 MIT，README 对猫狗美术另有作者署名；本游戏没有复制其角色图或动画。
- [Kenney Animal Pack](https://kenney.nl/assets/animal-pack)：研究同套动物素材的一致性。官方标注 CC0；本游戏没有导入该素材包。
- 本版七张正式插画均使用内置 `image_gen` 工具生成；以本项目先生成的西高地插画作为其余角色的风格、姿态及篮筐参考。没有使用上述项目的图片作为生成输入。

## 交付文件

| 文件 | 用途 | 尺寸 |
| --- | --- | --- |
| `assets/illustrated/westie.webp` | 西高地，白色蓬松毛、小尖耳 | 640 × 640，透明 |
| `assets/illustrated/teddy.webp` | 泰迪，杏棕卷毛、圆垂耳 | 640 × 640，透明 |
| `assets/illustrated/collie.webp` | 边牧，黑白花、白额纹、半立耳 | 640 × 640，透明 |
| `assets/illustrated/ginger.webp` | 橘猫，橘色虎斑、绿眼睛 | 640 × 640，透明 |
| `assets/illustrated/ragdoll.webp` | 布偶，长毛、蓝眼睛、浅色倒 V 脸纹 | 640 × 640，透明 |
| `assets/illustrated/cowcat.webp` | 奶牛猫，非对称黑白花、金眼睛 | 640 × 640，透明 |
| `assets/illustrated/park.webp` | 阳光绘本花园 | 1280 × 801 |

PNG 原画保存在本地 `output/imagegen/originals/`，保留原始透明度；该输出目录由 `.gitignore` 排除，不随网页发布。使用 Sharp 进行常规缩放及 WebP 压缩，六只宠物保留 alpha 通道。正式图片合计约 0.90 MiB。旧版 SVG 保留为草稿，页面不再引用。

## 最终提示词集

以下为角色提示词的统一规格与各品种差异。其余五只角色使用西高地原画作为参考图，参考作用为风格、构图、姿态、篮筐和光线一致性；不复制西高地的品种特征。

### 六只角色的共同规格

```text
Use case: illustration-story.
Asset type: production 2D game sprite with a true transparent background.
Create one complete, full-body young pet holding an integrated wicker catching basket.
Premium cozy picture-book gouache and colored-pencil illustration, soft tactile fur,
expressive natural eyes, gentle friendly expression, warm light from the upper left.
Front view with a tiny three-quarter turn; seated body, front paws resting on the near
rim of a wide open honey-colored wicker basket. Show the dark empty basket interior;
no coins. Complete ears, paws, body and tail; tail curls to the right.
Sage-green collar and a small brass tag. Warm ivory and oatmeal highlights.
Square composition, centered character occupying about 82% of frame height,
ear tips near 10%, catching rim near 65–66%, basket base near 90%.
Keep the basket, pose, lighting, scale and painted material consistent across the set.
No floor, background, exterior shadow, text, stars, logo, border or watermark.
Avoid flat SVG, emoji, plastic 3D, disconnected head/body, or cut-off limbs.
```

| 角色 | 叠加的主体描述 |
| --- | --- |
| 西高地 | Complete West Highland white terrier puppy, fluffy white fur, small pointed ears with subtle pink interiors, beard, dark natural eyes, small black nose, friendly small open mouth. |
| 泰迪 | Apricot teddy poodle puppy, dense curly coat, round floppy ears, dark hazel eyes, curly body and tail, lighter creamy highlights. |
| 边牧 | Black-and-white fluffy border collie puppy, semi-pricked ears, white forehead blaze, white muzzle/chest/paws, brown eyes, bushy tail with white tip, subtle pink tongue. |
| 橘猫 | Clearly feline kitten, pointed ears, whiskers, small pink triangular nose, warm orange tabby stripes on forehead/cheeks/legs/tail, creamy white muzzle/bib/paws, muted green almond eyes, gentle closed mouth, long curled tail. |
| 布偶 | Ragdoll kitten, long ivory-white fur, warm gray seal ears and mask, inverted white V on face, sky-blue almond eyes, white chest/paws, long fluffy gray tail. |
| 奶牛猫 | Cow-pattern kitten, asymmetric black-and-white patches, one black ear and one white ear, black patch around one eye, white muzzle, amber-gold almond eyes, mostly white body with black spots, long black tail with white tip. |

### 花园背景提示词

```text
Use case: illustration-story. Asset type: landscape background for a polished cozy 2D pet coin-catching browser game. Create a softly painted sunlit storybook garden with an EMPTY UNCLUTTERED CENTRAL PLAY AREA. Match the warm illustrated animal sprites in the reference only in art quality, warm lighting and soft painted texture; DO NOT include the animal or basket. Wide landscape roughly 8:5 aspect. Top 55 percent: pale creamy blue sky with a few soft handpainted clouds near outer edges, gentle sunlight from upper left, no dramatic sun circle. Bottom 45 percent: layered rolling sage-green garden hills, a quiet flat sunlit grassy play clearing along the foreground where characters can stand; soft painterly grass texture and a few tiny white daisies near lower corners. A small distant wooden fence on far left and right, softly painted rounded shrubs and a leafy tree at far left and right EDGE ONLY. Center remains open so falling gold coins are highly visible. Rich but restrained natural tones: warm ivory, muted sage, soft golden sunlight, dusty sky blue. Warm, tactile, delicate gouache/watercolor and pencil storybook game art, lightly detailed edges and simple center. Artist-quality compositional balance; depth from overlap and tonal layers, not blur filters. Foreground bottom at 90 percent is grassy earth; no path through the center. No characters, no pets, no people, no basket, no coins, no game UI, no text, no logo, no vignette, no border, no stars, no watermark. This is a usable playable game stage backdrop, not a busy landscape poster.
```

## 游戏内呈现

选择卡片、欢迎画像、页头和游戏角色共用正式素材。Canvas 按完整角色绘制，窄屏保持宠物比例，篮筐口与接取碰撞线对齐；轻微呼吸浮动、移动倾斜、接到奖励时跳跃提供反馈。启用系统减少动态效果时关闭装饰动画。没有把静态插画描述为逐帧动画。

为给尾巴留出空间，左右移动边界略向内收；规则测试覆盖两侧最远生成位置的金币仍然可接取。
