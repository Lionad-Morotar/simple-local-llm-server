---
name: prompt-to-image
description: 将文本提示词生成图片。使用场景：(1) 用户要求"生成图片"、"创建图像"、"画一张图" (2) 用户描述视觉场景并希望看到图片 (3) 用户说"prompt to image"、"text to image"等关键词。默认使用 gemini-3-pro-image-preview 模型，支持自定义模型名称。图片和响应会保存到 ~/.prompt-to-image/ 目录。自动从上下文提取提示词，生成后自动打开图片。
---

## 工作流程

### 1. 提取提示词

按照以下优先级自动提取提示词：

**提取来源（二选一，优先级从高到低）：**
1. **用户当前输入** - 排除 "/prompt-to-image" 命令本身后的内容
2. **对话上下文** - 查找之前生成的提示词（按以下格式优先级）

**提示词格式（三选一，优先级从高到低）：**
1. **中文优化版** - 夹杂英文术语的版本（如：抽象表现主义(Abstract Expressionism)）
2. **英文版** - 纯英文结构化提示词
3. **纯中文版** - 纯中文描述

**提取策略：**
- 检查用户输入是否包含视觉描述关键词（主体、风格、色彩、构图等）
- 若当前输入无有效提示词，回溯对话历史查找最近生成的完整提示词
- 提示词通常出现在 "image-to-prompt" 技能的输出中

### 2. 解析模型参数

- **模型名称** (可选): 默认 `gemini-3-pro-image-preview`
- 用户可指定："用 gemini-2.0-flash-exp 生成图片"

### 3. 调用 API

使用 curl 发送请求到 Gemini API:

```bash
curl --location --request POST \
  'https://grsapi.xyz/v1beta/models/<model-name>:generateContent?key=' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer sk-9TxcxxgadHP6MpJZhNiMbjaKTofWVdRGqGLKXLd1YLHwR3a0' \
  --data-raw '{
    "contents": [{
      "role": "user",
      "parts": [{"text": "<提取的提示词>"}]
    }],
    "generationConfig": {
      "responseModalities": ["TEXT", "IMAGE"]
    }
  }'
```

### 4. 保存响应

创建目录结构并保存完整响应:

```
~/.prompt-to-image/
  └── <YYYY-MM-DD>/
      └── grsapi.xyz/
          └── <model-name>/
              ├── <hh:mm:ss.sss>.json  (完整 API 响应)
              └── image_xxx.jpg        (提取的图片)
```

**时间戳格式**:
- 日期: `2026-02-24`
- 时间: `15-30-45.123` (小时-分钟-秒.毫秒)

### 5. 提取图片

使用 `scripts/extract_images.py` 从响应中提取 base64 图片:

```bash
python3 scripts/extract_images.py <response.json> <output_dir>
```

### 6. 自动打开图片

提取图片后，自动使用以下命令打开：

```bash
# 优先检查并使用 trae
if command -v trae &> /dev/null; then
    trae <图片路径>
else
    open <图片路径>
fi
```

### 7. 返回结果

向用户返回 Markdown 格式的图片链接，并确认已自动打开:

```markdown
![image name](~/.prompt-to-image/2026-02-24/grsapi.xyz/gemini-3-pro-image-preview/image_15-30-45.jpg)

✅ 图片已自动打开
```

## 示例

**示例 1 - 直接使用当前输入:**
```
用户: /prompt-to-image 生成一张猫咪的图片
→ 提取提示词: "生成一张猫咪的图片"
```

**示例 2 - 从上下文提取（刚用 image-to-prompt 生成提示词）:**
```
用户: /image-to-prompt cat.png
[输出生成中英文提示词]

用户: /prompt-to-image
→ 自动提取上一步生成的提示词（优先中文优化版）
```

**示例 3 - 指定模型:**
```
用户: /prompt-to-image 用 gemini-2.0-flash-exp 生成
→ 使用指定模型，提示词从上下文提取
```

## 错误处理

- **未找到提示词**: 提示用户请提供图片描述或先使用 image-to-prompt 生成提示词
- **API 调用失败**: 报告错误信息，不创建文件
- **响应无图片**: 提示用户响应中未包含图片
- **文件写入失败**: 检查目录权限，报告错误
- **无法打开图片**: 报告图片路径，用户可手动打开

## 资源

### scripts/extract_images.py

从 Gemini API 响应中提取 base64 编码的图片并保存为文件。

**用法**:
```bash
python3 scripts/extract_images.py <response.json> <output_dir>
```

**功能**:
- 解析 `candidates[].content.parts[].inlineData` 中的图片数据
- 解码 base64 数据
- 根据 MIME 类型保存为 `.jpg`、`.png` 等文件
- 自动处理重名文件
