# Text-Segment - 智能文本分段工具

高性能的文本分段工具，支持多种分段策略、智能质量评估和批量并发处理。

## ✨ 主要特性

- 🧠 **语义分段**: 智能分析文本结构，保持语义完整性
- 📊 **质量评估**: 自动评估分段质量（长度、完整性、均衡性、边界）
- 📋 **JSON 输出**: 结构化数据，便于程序处理
- ⚙️  **灵活配置**: 可调整最小/最大/首选段落长度
- 🚀 **高性能处理**: Worker 多线程并发处理
- 📈 **动态优化**: 根据 CPU 使用率自动调整并发数
- 🔄 **断点续传**: 跳过已处理文件，支持增量处理
- 📁 **完整记录**: done.json 记录处理结果，error.json 记录失败文件

## 📦 目录结构

```
packages/text-segment/
├── .txt/                  # 输入目录：存放待分段的文本文件
├── .segments/             # 输出目录：分段后的文件
├── .config/               # 配置目录
│   ├── done.json          # 已完成记录（含质量评分）
│   └── error.json         # 处理失败记录
├── index.ts               # 主入口文件
├── segmentStrategies.ts   # 分段策略实现
├── qualityEvaluator.ts    # 质量评估器
├── textProcessor.ts       # 文本处理核心
├── worker.js              # Worker 线程处理
├── doneManager.ts         # 完成记录管理
├── errorManager.ts        # 错误记录管理
└── README.md              # 本文件
```

## 🚀 快速开始

### 1. 准备文本文件

将待分段的 `.txt` 文件放入 `.txt` 目录：

```bash
mkdir -p packages/text-segment/.txt
cp your-text.txt packages/text-segment/.txt/
```

### 2. 运行分段

```bash
# 默认配置（优先段落边界）
pnpm start:text-segment

# 使用严格段落模式（强制按双换行分段）
WEIGHTS_PRESET=strictParagraph pnpm start:text-segment

# 自定义长度范围
MIN_LENGTH=100 MAX_LENGTH=800 pnpm start:text-segment

# 使用自定义策略
CUSTOM_STRATEGY=./my-strategy.js pnpm start:text-segment

# 调整滑动窗口和步进
WINDOW_SIZE=2000 STEP_SIZE=1000 pnpm start:text-segment
```

### 3. 查看结果

```bash
# 查看 JSON 格式结果（含详细质量指标）
cat packages/text-segment/.segments/your-text.segments.json

# 使用 jq 格式化查看
cat packages/text-segment/.segments/your-text.segments.json | jq .
```

## ⚙️ 配置选项

通过环境变量配置分段参数：

| 环境变量 | 默认值 | 说明 |
|---------|-------|------|
| `MIN_LENGTH` | `50` | 最小段落长度（字） |
| `MAX_LENGTH` | `500` | 最大段落长度（字） |
| `PREFERRED_LENGTH` | `200` | 首选段落长度（字） |
| `WEIGHTS_PRESET` | `default` | 权重预设：`default`/`strictParagraph`/`balanced`/`lengthFirst`/`semanticFirst` |
| `WINDOW_SIZE` | `1000` | 滑动窗口大小（字符数） |
| `STEP_SIZE` | `500` | 步进大小（字符数） |
| `CUSTOM_STRATEGY` | - | 自定义策略文件路径（.js 文件） |

> **注意**: 工具使用高级分段器，优先双换行分段，字数为次要考虑因素

## 📋 高级分段算法

工具使用**基于权重的高级分段策略**，通过滑动窗口和多维度评分实现智能分段。

### 核心特点

- 🎯 **优先级分段**: 双换行（段落边界）> 句子边界 > 长度优化 > 语义连贯
- 📊 **权重机制**: 可配置的四维权重系统（paragraphBoundary, sentenceBoundary, lengthOptimization, semanticCoherence）
- 🪟 **滑动窗口**: 逐段扫描文本，选择质量最高的分段点
- 🔌 **可扩展**: 支持加载外部 JS 策略文件
- 🧠 **智能评分**: 综合考虑边界类型、长度合理性、句子完整性

### 权重预设

1. **default** (默认): 段落 50%, 句子 25%, 长度 15%, 语义 10%
2. **strictParagraph** (严格段落): 段落 80%, 其他各 5-10%
3. **balanced** (平衡): 段落 40%, 句子 30%, 长度 20%, 语义 10%
4. **lengthFirst** (长度优先): 长度 35%, 段落 30%, 句子 25%, 语义 10%
5. **semanticFirst** (语义优先): 语义 25%, 段落 35%, 句子 25%, 长度 15%

### 适用场景

- ✅ PDF OCR 后的文本（自动识别段落边界）
- ✅ 需要精确控制分段策略的场景
- ✅ 长文档智能拆分（滑动窗口处理）
- ✅ 需要自定义分段逻辑的项目

## 📊 质量评估系统

工具会自动评估分段质量，生成详细报告：

### 评估维度

1. **长度适中性 (30%权重)**
   - 段落长度是否在合理范围
   - 是否接近首选长度
   - 过长或过短的段落数量

2. **段落完整性 (25%权重)**
   - 段落开头是否合理（大写、引号、数字等）
   - 段落结尾是否合理（句号、引号等）
   - 是否包含完整句子

3. **长度均衡性 (25%权重)**
   - 段落长度分布是否均匀
   - 标准差和变异系数
   - 避免部分段落过长过短

4. **边界合理性 (20%权重)**
   - 分段位置是否在自然断点
   - 前后段落的衔接是否流畅
   - 避免在句子中间分割

### 评分标准

- **95-100**: A+ (优秀)
- **90-94**: A (很好)
- **85-89**: A- (良好)
- **80-84**: B+ (中上)
- **75-79**: B (中等)
- **70-74**: B- (中下)
- **60-69**: C (及格)
- **<60**: D (需改进)

### 质量报告示例

```
📊 分段质量报告
==================================================

✨ 总体评分: 87/100 (A-)

📈 详细指标:
  长度适中性: 92/100
  段落完整性: 85/100
  长度均衡性: 88/100
  边界合理性: 82/100

📋 统计信息:
  总段落数: 15
  平均长度: 235 字
  长度范围: 89 ~ 487 字
  标准差: 78

💡 优化建议:
  ✅ 分段质量优秀，无需调整！
```

## 🔧 使用示例

### 基本用法

```bash
# 1. 准备文本
cp article.txt packages/text-segment/.txt/

# 2. 执行分段
pnpm start:text-segment

# 3. 查看结果
cat packages/text-segment/.segments/article.segments.txt
```

### 批量处理

```bash
# 复制多个文件
cp *.txt packages/text-segment/.txt/

# 批量分段
pnpm start:text-segment
```

### 增量处理

```bash
# 第一次处理
pnpm start:text-segment

# 添加新文件
cp new-file.txt packages/text-segment/.txt/

# 第二次处理（自动跳过已处理的文件）
pnpm start:text-segment
```

### 调整长度参数

```bash
# 自定义长度范围
MIN_LENGTH=100 MAX_LENGTH=800 PREFERRED_LENGTH=300 pnpm start:text-segment

# 删除记录重新处理
rm packages/text-segment/.config/done.json
pnpm start:text-segment
```

### JSON 输出格式

工具默认输出 JSON 格式，包含完整的质量指标和分段信息：

```bash
# 查看 JSON 结构
cat packages/text-segment/.segments/file.segments.json | jq .
```

**输出示例**：

```json
{
  "filename": "article.txt",
  "strategy": "semantic",
  "config": {
    "minLength": 50,
    "maxLength": 500,
    "preferredLength": 200
  },
  "quality": {
    "overallScore": 87,
    "lengthScore": 92,
    "coherenceScore": 85,
    "balanceScore": 88,
    "boundaryScore": 82,
    "totalSegments": 15,
    "avgLength": 235,
    "minLength": 89,
    "maxLength": 487
  },
  "totalSegments": 15,
  "segments": [
    {
      "index": 1,
      "text": "第一段内容...",
      "length": 245
    }
    // ...
  ]
}
```

## 📈 性能优化

### CPU 使用率动态调整

- **低于 70%**: 增加 2 个并发线程
- **高于 90%**: 减少 1 个并发线程
- **目标 80%**: 保持最佳性能平衡

### 并发限制

- **最小**: 2 个线程
- **最大**: CPU 核心数 × 2
- **初始**: 10 个线程（或最大值）

## 🐛 故障排查

### 问题：找不到文本文件

```
📂 未找到任何 TXT 文件
💡 请将 .txt 文件放在 /path/to/packages/text-segment/.txt 目录下
```

**解决**: 确保文件放在正确的目录，且扩展名为 `.txt`

### 问题：分段质量低

查看质量报告中的建议：

```bash
cat packages/text-segment/.segments/file.segments.txt | head -30
```

根据建议调整：
- 长度适中性低 → 调整 MIN_LENGTH/MAX_LENGTH
- 完整性低 → 尝试 semantic 或 mixed 策略
- 均衡性低 → 调整 PREFERRED_LENGTH
- 边界合理性低 → 尝试 sentence 策略

### 问题：重新处理文件

删除 done.json 中的记录：

```bash
# 重新处理所有文件
rm packages/text-segment/.config/done.json

# 或手动编辑 done.json 删除特定记录
```

## 📊 JSON 输出格式

工具输出的 JSON 文件包含完整的配置、质量指标和所有段落内容，适合程序化处理：

```json
{
  "filename": "示例文件.txt",
  "strategy": "semantic",
  "config": { "minLength": 50, "maxLength": 500, "preferredLength": 200 },
  "quality": {
    "overallScore": 92,
    "lengthScore": 85,
    "coherenceScore": 98,
    "balanceScore": 93,
    "boundaryScore": 93,
    "totalSegments": 8,
    "avgLength": 235
  },
  "totalSegments": 8,
  "segments": [
    { "index": 1, "text": "第一段内容...", "length": 245 }
  ]
}
```

## 💡 最佳实践

1. **合理设置长度**: 根据应用场景调整 MIN/MAX/PREFERRED_LENGTH
   - 短文本应用: MIN=30, MAX=300, PREFERRED=150
   - 长文档: MIN=100, MAX=800, PREFERRED=400
2. **关注质量评分**: 低于 80 分时考虑调整长度参数
3. **增量处理**: 利用 done.json 避免重复处理
4. **使用 jq 处理**: JSON 输出配合 jq 工具进行数据处理
5. **保留质量数据**: quality 字段包含完整的分段质量分析

## 🔗 相关工具

- **html2md**: HTML 转 Markdown
- **pdf2md**: PDF 转 Markdown（支持 OCR）
- **md2txt**: Markdown 转纯文本

## 📝 注意事项

1. **文件编码**: 确保文本文件使用 UTF-8 编码
2. **文件大小**: 大文件处理时间较长，请耐心等待
3. **并发数**: 系统会自动优化，无需手动调整
4. **特例段落**: 允许少量段落超出长度限制以保持完整性

## 📄 License

ISC
