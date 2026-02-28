---
name: image-to-prompt
description: 将图片或文本描述转换为完整 AI 绘画提示词。当用户想要根据参考图、照片或文字描述生成适用于各种 AI 绘画工具（Midjourney、Stable Diffusion、FLUX、DALL-E 等）的专业提示词时使用。适用于：上传图片并请求生成提示词、将照片转化为特定艺术风格、根据文字描述构建结构化提示词、需要系统化的提示词构建框架。
---

# Image to Prompt - 图片/文本转 AI 绘画提示词

将用户输入（图片或文字）转换为高质量、结构化的 AI 绘画提示词。


## 工作步骤

创建一个任务清单，执行以下两个任务：
1. 处理输入
2. 细致分析
3. 生成输出

<step-1>

### 图片输入

**图片来源判断：**

1. **路径/网址输入**（如 `/path/to/image.png` 或 `https://example.com/image.jpg`）
   - 使用图片分析工具（`mcp__zai-mcp-server__analyze_image`）提取详细视觉信息
   - 基于分析结果构建提示词

2. **直接粘贴输入**（用户将图片粘贴到对话中）
   - 使用模型自身的视觉能力直接分析对话中的图片
   - 详细描述图片内容（无需调用外部工具）

**分析维度**（根据图片内容灵活调整，复杂图片可扩充至最多4k个分析维度）：
```md
1. 核心视觉层 (Core Visual Layer)
主体 (Subject)：
具象维度：识别人物/物体/生物的数量、姿态、动作、表情、服饰及物理特征。
抽象维度：若无具体主体，描述其形态（如流体、几何体）、运动态势（如旋转、爆炸、静止）及视觉聚合点。
构图 (Composition)：
空间布局：分析画面布局（向心、三分法、黄金分割）、焦点位置、对称性/非对称性。
视线引导：线条流向、层次感（前景/中景/背景）、画幅比例及其带来的视觉影响。
色彩 (Color)：
基础参数：主色调、配色方案（如互补色、同类色）、对比度、饱和度。
色彩心理：色彩传递的温度（冷/暖）、重量感及情感联想。
光影 (Light)：
物理属性：光源方向（顶/侧/逆光）、光线质感（柔光/硬光/漫反射）。
氛围营造：明暗调性（High-key/Low-key）、阴影的形态与深浅、环境光感。
2. 风格与技法层 (Style & Technique Layer)
美学风格 (Style)：
流派定位：艺术流派（如印象派、极简主义、赛博朋克）、时代感、文化特征。
视觉语言：摄影风格（如黑色电影、纪实摄影）或绘画技法（如厚涂、水墨）。
技术细节 (Technical Details)：
质感与纹理：材质表面（光滑/粗糙）、颗粒感/噪点（Grain）、笔触痕迹。
特殊效果：光学瑕疵模拟（如色散、暗角）、动态模糊（Motion Blur）、景深/虚化（Bokeh）、光晕。
3. 认知与叙事层 (Cognitive & Narrative Layer)
细节微观 (Micro-Details)：
捕捉容易被忽略的微小元素（如背景中的隐藏物体、微小的文字信息、材质的细微破损）。
情绪与氛围 (Emotion & Atmosphere)：
整体基调：画面传递的第一直觉（如压抑、欢快、神秘、宁静）。
深层情感：分析画面元素如何引发特定的心理反应（如焦虑、孤独、希望）。
符号与隐喻 (Semiotics & Metaphor)：
叙事暗示：画面仿佛在讲述什么故事？捕捉的是哪个瞬间（发生前/发生后）？
象征意义：分析图像中的符号（如“镜子”代表内省，“风暴”代表混乱）及其文化互文性。
通感体验 (Synesthesia)：
描述观看图像时引发的非视觉联想（如听觉上的噪音/寂静、触觉上的冷热/刺痛感）。
```

**分析示例**（浓雾中的电线杆）：
```md
### **1. 核心视觉层 (Core Visual Layer)**

*   **主体 (Subject)**：
    *   **具象维度**：画面中有三个主要的垂直结构——**木质电线杆**。前景的一根最为显著，略微向右倾斜，顶端带有横臂和变压器状物体，几根断裂或松弛的电线垂落下来。背景中还有两根较模糊的电线杆，呈线性排列延伸至远处。在画面右侧中景处，有一个极为渺小的**人形剪影**，似乎是一个穿着深色衣服的人孤独伫立。
    *   **抽象维度**：电线杆构成了强烈的**垂直线条**，与地面的水平线形成交错，但在浓雾的侵蚀下，这些线条显得脆弱且不完整。垂落的电线形成了无力的曲线，暗示着重力与废弃。

*   **构图 (Composition)**：
    *   **空间布局**：采用**深景深**构图，利用透视原理将视线引向远方。前景巨大的倾斜电线杆占据了左侧主导地位，与右侧远处的微小人物形成**大小对比**和**视觉平衡**。
    *   **视线引导**：电线杆的排列形成了一条隐形的对角线引导线，将观众的视线从左前方向右后方牵引，最终消失在迷雾中。
    *   **画幅比例**：竖构图增强了画面的压抑感和纵深感，强调了天空（雾气）的沉重。

*   **色彩 (Color)**：
    *   **基础参数**：**极低饱和度**，接近单色画。主色调为灰绿色（Sage Green/Grey）和暗褐色（Sepia/Dark Brown）。
    *   **色彩心理**：这种暗淡、浑浊的色调传递出**寒冷、潮湿、陈旧**和**死寂**的感觉。缺乏暖色调，完全剥夺了画面的生机与希望感。

*   **光影 (Light)**：
    *   **物理属性**：**极度柔和的漫反射光**（Soft/Diffused Light）。由于浓雾的存在，光源方向不可辨认，光线平坦且均匀，没有强烈的阴影。
    *   **氛围营造**：属于**低调（Low-key）**摄影，整体亮度偏低。雾气作为一种介质，散射了光线，导致物体边缘模糊，营造出一种梦境般或末日后的朦胧感。

### **2. 风格与技法层 (Style & Technique Layer)**

*   **美学风格 (Style)**：
    *   **流派定位**：
        *   **美国南方哥特式 (Southern Gothic)**：荒凉的田野、废弃的工业设施，透露出一种衰败和不安。
        *   **阈限空间 (Liminal Space)**：这是一个过渡性的场所，既非起点也非终点，充满了不确定性和诡异的熟悉感。
        *   **寂静岭美学 (Silent Hill Aesthetic)**：浓雾、废弃设施和孤独的人影是该风格的标志性元素。
    *   **视觉语言**：具有强烈的**电影感 (Cinematic)**，像是一部悬疑片或恐怖片的定场镜头。

*   **技术细节 (Technical Details)**：
    *   **质感与纹理**：画面叠加了明显的**胶片颗粒 (Film Grain)**，增加了粗糙的质感，模拟了老旧照片或高感光度底片的效果。这种噪点不是瑕疵，而是增强了“真实感”和“纪实感”。
    *   **特殊效果**：**大气透视 (Atmospheric Perspective)** 被运用到了极致，雾气随着距离增加而变浓，使得远处的物体逐渐溶解在背景中。

### **3. 认知与叙事层 (Cognitive & Narrative Layer)**

*   **细节微观 (Micro-Details)**：
    *   **垂落的电线**：这不仅是物理细节，更是**功能失效**的标志。电线本应紧绷传递能量，这里的垂落意味着断联、废弃和文明的退场。
    *   **倾斜的角度**：前景电线杆不仅破旧，而且是歪斜的，暗示了地基的不稳或曾遭受过外力的撞击/风暴，处于一种摇摇欲坠的临界状态。

*   **情绪与氛围 (Emotion & Atmosphere)**：
    *   **整体基调**：**孤独 (Isolation)**、**荒凉 (Desolation)**、**神秘 (Mystery)**。
    *   **深层情感**：这种迷雾中的静止画面容易引发**存在主义焦虑**。那个渺小的人影面对巨大的、废弃的工业遗迹，强化了人类在自然或不可知力量面前的渺小与无力。

*   **符号与隐喻 (Semiotics & Metaphor)**：
    *   **电线杆**：通常象征着沟通、连接和现代文明。在这里，它们是断裂和废弃的，象征着**沟通的失败**或**文明的遗迹**。
    *   **迷雾**：象征着**未知**、**迷失**和**隔离**。它遮蔽了视野，让人看不清前路，也看不清来路。
    *   **孤独的观察者**：那个微小的人影可以被看作是观众的**化身 (Avatar)**，迷失在这个充满迷雾的异世界中。

*   **通感体验 (Synesthesia)**：
    *   **听觉**：看着这张图，仿佛能听到**风吹过枯草的沙沙声**，或者远处沉闷的**低频嗡嗡声**，亦或是**绝对的死寂**（耳鸣般的安静）。
    *   **触觉**：能感受到**潮湿粘腻的空气**粘在皮肤上，以及刺骨的**阴冷**。
    *   **嗅觉**：空气中似乎弥漫着**潮湿泥土**、**腐烂植被**和**生锈金属**的气味。

**总结**：
这张图像是一幅极具表现力的**反乌托邦风景画**。它通过**迷雾**这一核心元素，成功地将现实世界异化，利用**废弃的工业符号**（破损的电线杆）和**孤独的人影**，构建了一个关于**遗忘、断联和孤独**的视觉叙事。它不仅仅是在展示一个场景，更是在唤起一种深入骨髓的寒意和对未知的敬畏。
```
分析示例结束。

**分析后构建提示词：**
1. 整合上述分析结果
2. 如用户指定目标风格，优先采用该风格描述
3. 生成提示词

### 文本输入
1. 解析描述中的核心视觉元素
2. 识别隐含风格倾向（如"梦幻"暗示柔和光线）
3. 补充合理的细节使提示词完整

### 混合输入（用户同时给了图片可提示词）
你需仔细识别用户具体意图，例如用户可能想：
- 基于图片描述生成新的提示词
- 合并图片与文本描述，创建更丰富的提示词

</step-1>

<step-2>

## 细致分析

- **具体而非笼统**：不说"beautiful lighting"，而是"golden hour side lighting casting long shadows"
- **分层描述**：从整体构图 → 主体细节 → 背景环境
- **风格一致**：确保风格、色彩、光影描述相互协调
- **避免过度堆砌**：质量词适度原则

## 风格定义技巧

### 参考艺术家/作品
当需要精准定义风格时，可引用：
- **艺术家**：`in the style of [Artist Name]` 或风格混合（如：`Katsuhiro Otomo meets Moebius`）
- **艺术作品**：参考具体作品的美学特征（如：`Blade Runner 2049 cinematography aesthetic`）
- **流派/运动**：`Art Nouveau`, `De Stijl`, `Ukiyo-e`, `Bauhaus`

**原则**：1-2 个参考足够，过多会混淆风格。优先选择与用户意图最直接相关的参考。

### 镜头与摄影参数
写实或摄影风格可添加：
- **镜头类型**：`wide-angle lens`, `85mm portrait lens`, `fisheye`, `macro`
- **光圈/景深**：`shallow depth of field`, `f/1.8`, `bokeh background`
- **构图术语**：`Dutch angle`, `worm's eye view`, `bird's eye view`, `rule of thirds`
- **胶片/设备**：`shot on Kodak Portra 400`, `Hasselblad medium format`, `vintage Polaroid`

**原则**：仅当摄影感是风格核心时使用，插画/概念艺术类无需强行添加。

## 负面提示词（Negative Prompt）

当生成写实类或需要排除特定元素时，建议添加负面提示词：
- **通用排除**：`low quality, blurry, distorted, deformed, ugly, duplicate, watermark, signature`
- **人像排除**：`bad anatomy, extra limbs, missing fingers, mutated hands, poorly drawn face`
- **风格排除**：根据目标风格排除相反特征（如写实风格排除`cartoon, anime, illustration`）

**原则**：负面提示词仅在用户明确要求或风格需要时添加，通常 3-5 个足够，过多会稀释效果。

## 权重与强调

需要强化或弱化特定元素时：
- **强调**：`(keyword)` 或 `(keyword:1.2)` 增加权重
- **弱化**：`[keyword]` 或 `(keyword:0.8)` 减少权重
- **避免过度**：权重范围 0.5-1.5 为宜，过高会导致扭曲

**应用时机**：当描述中包含多个元素需要区分主次，或某些词容易被忽略时使用。

## 画幅比例建议

根据构图意图推荐比例：
- **1:1** — 头像、图标、对称构图
- **16:9** / **2:1** — 风景、全景、电影感
- **9:16** — 全身人像、竖版海报
- **4:3** — 插画、文档配图
- **21:9** — 超宽 cinematic

**原则**：比例服务于构图意图，宽画幅强化延伸感，方画幅聚焦中心，竖画幅强化纵深感，推荐一种画幅即可。

</step-2>

<step-3>

每个请求对应两个版本：通用版本（英文）和中文版本。直接输出对应提示词（```plaintext\n<提示词>\n```）即可，默认输出中文版本，除非用户指定了语言版本。

中文版本的**专业术语后标注英文**，如：
- 艺术风格（如：赛博朋克(Cyberpunk)、巴洛克(Baroque)）
- 技术术语（如：景深(Depth of field)、三分法(Rule of thirds)）
- 材质/纹理（如：厚涂(Impasto)、丝网印刷(Screen printing)）

## 示例

**输入**：一个盘腿坐着的小孩，手里拿着一个胡桃夹子玩具士兵，新波普艺术风格

**通用版本**：
```
Subject: A child sitting cross-legged on a wooden floor, gently holding a colorful nutcracker toy soldier with both hands, soft smile, relaxed shoulders, wearing cozy knitted sweater and loose pants.

Style: Neo-pop art style inspired by Patrick Nagel and Memphis Group aesthetics, paper-cut collage technique with vector-art sharpness, celebrating 1980s graphic design revival.

Color: Vibrant palette of coral red (#FF6B6B), deep indigo (#4A3B8C), sunshine yellow (#FFD93D), mint green (#6BCB77), cream white (#FFF8E7). High contrast complementary relationships, flat color fields with zero gradients.

Composition: Centered subject with radial burst background, child's face at golden ratio upper-third intersection, toy soldier positioned at lower-right power point creating diagonal visual flow.

Technique: Geometric deconstruction — face simplified into triangular cheek planes, hair as flowing ribbon-like color strips, clothing broken into irregular polygon segments. Bold black outlines 3px weight, sharp vector edges with intentional micro-roughness for handmade feel.

Texture: Fine grain texture (15% opacity) overlaying yellow and red color blocks, mimicking risograph printing with slight CMYK registration drift effect. Visible paper fiber texture in white areas.

Background: Explosive radial rays emanating from behind child's head, alternating wide beams and thin sharp lines in palette colors. Floating geometric confetti shapes scattered in upper-right quadrant. Horizontal striped banner in indigo and yellow floating mid-ground.

Mood: Joyful energy, nostalgic childhood wonder, bold optimism, graphic poster impact.

Quality: Vector illustration precision, print-ready, poster art quality.
```

**中文版本**：
```
主体(Subject)：一个小孩盘腿坐在木质地板上，双手轻轻捧着一个色彩斑斓的胡桃夹子(nutcracker)玩具士兵，表情柔和微笑，肩膀放松，身着舒适针织毛衣(knitted sweater)和宽松长裤。

风格(Style)：新波普艺术(Neo-pop art)风格，融合 Patrick Nagel 和孟菲斯小组(Memphis Group)美学，剪纸拼贴(paper-cut collage)技法结合矢量艺术(vector-art)锐利度，颂扬1980年代平面设计复兴。

色彩(Color)：活力配色方案——珊瑚红(#FF6B6B)、深靛蓝(deep indigo/#4A3B8C)、阳光黄(sunshine yellow/#FFD93D)、薄荷绿(#6BCB77)、米白(cream white/#FFF8E7)。高对比度互补色关系，纯色平涂(zero gradients)。

构图(Composition)：居中主体配合放射状背景，小孩面部位于黄金分割(golden ratio)上三分线交点，玩具士兵置于右下视觉锚点(lower-right power point)，形成对角线视觉流动(diagonal visual flow)。

技法(Technique)：几何解构(geometric deconstruction)——面部简化为三角形脸颊平面，头发化为飘带状色带，衣物分解为不规则多边形(irregular polygon)片段。粗黑描边(bold black outlines)3像素粗细，锐利矢量边缘带有刻意的微粗糙感(micro-roughness)以营造手工感。

质感(Texture)：细颗粒质感(fine grain texture/15%不透明度)覆盖黄色和红色色块，模拟Risograph印刷效果并带有轻微CMYK套色偏移(CMYK registration drift)。白色区域可见纸张纤维纹理(paper fiber texture)。

背景(Background)：从小孩头部后方爆发式放射状光线(explosive radial rays)，宽光束与细锐线条交替呈现配色方案色彩。右上象限散布漂浮几何纸屑图形(floating geometric confetti shapes)。中景有靛蓝与黄色相间的水平条纹横幅(horizontal striped banner)。

氛围(Mood)：欢乐活力、怀旧童真、大胆乐观、图形海报冲击力。

质量(Quality)：矢量插画精度，印刷就绪(print-ready)，海报艺术品质。
```

**输入**：意识流摄影，雨夜中行走的孤独身影，霓虹灯反射在湿滑的街道上

**通用版本示例**：
```
Subject: A solitary figure walking through rain-soaked city streets at night, silhouette partially obscured by motion blur, umbrella creating abstract circular shape, reflection fragmented in puddles.

Style: Stream of consciousness photography inspired by Saul Leiter and Daido Moriyama, embracing imperfection and fleeting moments. Intentional camera movement (ICM) creating painterly streaks, double exposure effect layering multiple temporal moments into single frame.

Color: Nocturnal palette dominated by deep blues (#1a1a2e) and violet shadows, punctuated by neon pink (#ff006e) and electric cyan (#00d9ff) reflections. Wet asphalt creating mirror-like chromatic aberration, color bleeding at frame edges.

Lighting: Multiple competing light sources — street lamps creating halos, neon signs casting colored shadows, car headlights leaving light trails. No single dominant light, atmospheric haze diffusing everything.

Composition: Off-center subject placement using rule of thirds, heavy foreground blur from raindrops on lens, vertical lines of buildings tilted (Dutch angle), puddle reflection inverting lower third of frame.

Technique: Slow shutter speed (1/8s) capturing motion trails, high ISO grain (3200+) adding texture, lens flare artifacts embracing imperfection, raindrops as organic bokeh filters.

Texture: Film grain visible, water droplets on lens creating soft diffusion, motion blur transforming sharp edges into impressionistic strokes, wet surfaces catching and fragmenting light.

Background: Out-of-focus urban environment — blurred storefronts, indistinct figures passing by, streaking car lights, rain streaks vertical across frame. No identifiable landmarks, pure atmospheric mood.

Mood: Melancholic solitude, urban alienation, fleeting beauty in mundane moments, nostalgic longing, cinematic poetry.

Camera: Shot on Leica M6 with 35mm f/1.4 Summilux, Kodak Vision3 500T film stock pushed one stop, handheld intentional shake.

Negative prompt: sharp focus, crisp edges, bright daylight, sunny, crowded scene, smiling people, cartoon, illustration.
```

**中文版本示例**：
```
主体(Subject)：一个孤独的身影(solitary figure)行走在雨夜的城市街道，剪影(silhouette)被动态模糊(motion blur)部分遮蔽，雨伞形成抽象圆形，倒影(reflection)在积水坑中支离破碎。

风格(Style)：意识流摄影(stream of consciousness photography)，受 Saul Leiter 和森山大道(Daido Moriyama)启发，拥抱不完美与转瞬即逝的瞬间。有意相机移动(ICM/intentional camera movement)创造绘画般的条纹，多重曝光(double exposure)将多个时间层次叠加于单一画面。

色彩(Color)：夜色调(nocturnal palette)以深蓝(#1a1a2e)和紫罗兰阴影为主，霓虹粉(neon pink/#ff006e)和电青色(electric cyan/#00d9ff)的反光点缀其间。湿润沥青如镜面般产生色差(chromatic aberration)，色彩在画面边缘晕染。

光线(Lighting)：多重竞争光源 — 街灯形成光晕(halos)，霓虹招牌投射彩色阴影，车灯拖出光轨(light trails)。无单一主导光源，大气雾气(atmospheric haze)扩散一切。

构图(Composition)：偏置主体使用三分法(rule of thirds)，镜头雨滴造成的前景模糊(foreground blur)，建筑垂直线条倾斜(荷兰角/Dutch angle)，积水倒影占据画面下三分之一。

技法(Technique)：慢快门(1/8秒)捕捉动态轨迹，高ISO颗粒(3200+)增添质感，镜头光晕(lens flare)瑕疵拥抱不完美，雨滴作为有机散景滤镜(organic bokeh filters)。

质感(Texture)：可见胶片颗粒(film grain)，镜头水滴创造柔和漫射(diffusion)，动态模糊将锐利边缘转化为印象派笔触(impressionistic strokes)，湿润表面捕捉并碎裂光线。

背景(Background)：失焦(out-of-focus)的城市环境 — 模糊的店面、经过的模糊人影、拖曳的车灯、垂直贯穿画面的雨线。无可识别的地标，纯粹的氛围情绪。

氛围(Mood)：忧郁的孤独(melancholic solitude)、城市疏离感(urban alienation)、平凡瞬间中 fleeting beauty、怀旧渴望(nostalgic longing)、电影诗歌(cinematic poetry)。

相机(Camera)：使用徕卡M6(Leica M6)搭配35mm f/1.4 Summilux镜头，柯达Vision3 500T胶片(Kodak Vision3 500T film stock)增感一档(pushed one stop)，手持刻意晃动。

负面提示词(Negative prompt)：锐利对焦、清晰边缘、明亮日光、晴天、拥挤场景、微笑的人群、卡通、插画。
```

</step-3>

## 平台特定扩展（仅当用户明确要求时）

- **Midjourney**：添加 `--ar [比例]`、`--stylize [值]`、`--v 6` 等参数
- **SD/FLUX**：添加负面提示词（negative prompt）
- **DALL-E**：描述更加自然语言化

## 其他要求

- 总的来说，提示词不应超过2000字