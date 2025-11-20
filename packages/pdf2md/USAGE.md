# PDF2MD 使用示例

## 快速开始

### 1. 放置 PDF 文件

```bash
# 将 PDF 文件复制到 .pdf 目录
cp ~/Documents/*.pdf packages/pdf2md/.pdf/
```

### 2. 运行转换

```bash
# 使用 npm script
pnpm start:pdf2md

# 或直接使用 tsx
tsx packages/pdf2md/index.ts
```

### 3. 查看输出

转换完成后，检查以下目录：

```bash
# 查看转换后的 Markdown 文件
ls packages/pdf2md/.md/

# 查看加密文件记录
cat packages/pdf2md/.config/lock.json

# 查看错误文件记录
cat packages/pdf2md/.config/error.json
```

## 示例输出

```
📂 未找到任何 PDF 文件
📁 请将 PDF 文件放入: /Users/lionad/Github/Local/packages/pdf2md/.pdf

# 或者当有文件时：

🚀 开始转换 5 个文件 (跳过 3 个已转换)
💻 CPU 核心数: 8，初始并发数: 10

🔄 [1/5] 处理 PDF: document1.pdf
✅ [1/5] document1.pdf → document1.md

🔄 [2/5] 处理 PDF: encrypted.pdf
🔒 [2/5] encrypted.pdf 已加密，跳过

🔄 [3/5] 处理 PDF: document2.pdf
✅ [3/5] document2.pdf → document2.md

📈 CPU 使用率 65.5%，增加并发数: 10 → 12

🔄 [4/5] 处理 PDF: document3.pdf
✅ [4/5] document3.pdf → document3.md

🔄 [5/5] 处理 PDF: document4.pdf
✅ [5/5] document4.pdf → document4.md

🎉 转换完成！共处理 5 个文件，跳过 3 个
🔒 检测到 1 个加密文件，已记录到 .config/lock.json
```

## 常见操作

### 重新转换已处理的文件

```bash
# 删除对应的 Markdown 文件
rm packages/pdf2md/.md/document1.md

# 重新运行
pnpm start:pdf2md
```

### 清除加密文件记录

```bash
# 编辑或删除 lock.json
echo '{"encryptedFiles":[]}' > packages/pdf2md/.config/lock.json
```

### 清除错误记录

```bash
# 编辑或删除 error.json
echo '[]' > packages/pdf2md/.config/error.json
```

### 批量转换

```bash
# 复制多个 PDF 文件
find ~/Documents -name "*.pdf" -exec cp {} packages/pdf2md/.pdf/ \;

# 运行转换
pnpm start:pdf2md
```

## 高级配置

### 调整并发数

编辑 `index.ts` 中的配置：

```typescript
const TARGET_CPU_USAGE = 0.8; // 目标 CPU 使用率 80%
const MIN_WORKERS = 2;        // 最小并发数
const MAX_WORKERS = os.cpus().length * 2; // 最大并发数
let WORKER_COUNT = Math.min(10, MAX_WORKERS); // 初始并发数
```

### 自定义页眉页脚检测

编辑 `pdfProcessor.ts` 中的 `detectHeaderFooter` 函数，调整检测逻辑：

```typescript
// 选择出现次数 >= 2 的文本作为页眉页脚关键词
const threshold = 2; // 可以调整这个阈值
```

## 故障排除

### 问题：PDF 无法转换

**可能原因**：
1. PDF 文件损坏
2. PDF 使用了不支持的格式
3. PDF 加密

**解决方法**：
- 使用 PDF 阅读器验证文件是否正常
- 检查 `.config/error.json` 查看错误信息
- 检查 `.config/lock.json` 查看是否被标记为加密

### 问题：转换后内容不完整

**可能原因**：
1. PDF 使用了特殊编码
2. 页眉页脚检测过于激进
3. PDF 文本被识别为图片

**解决方法**：
- 查看 `.processed/` 目录中的临时文本文件
- 调整页眉页脚检测阈值
- 尝试使用其他 PDF 工具先转换为标准格式

### 问题：转换速度慢

**解决方法**：
- 增加 `WORKER_COUNT` 初始值
- 提高 `TARGET_CPU_USAGE` 目标值
- 减少 `MIN_WORKERS` 允许更激进的并发

## 性能基准

测试环境：
- CPU: Apple M1 (8 cores)
- RAM: 16 GB
- 文件数量: 100 个 PDF
- 平均文件大小: 2 MB

结果：
- 平均转换速度: ~5 文件/秒
- CPU 使用率: 75-85%
- 内存使用: ~500 MB

## 技术细节

### PDF 处理流程

1. **加密检测**：使用 `pdf-lib` 尝试加载 PDF，捕获加密错误
2. **文本提取**：使用 `pdf-parse` 提取纯文本，自动忽略图片
3. **页眉页脚检测**：分析前几页的首尾行，找出重复文本
4. **文本清理**：移除检测到的页眉页脚和页码
5. **Markdown 转换**：格式化段落，添加适当的空行

### 并发控制

- 使用 Worker 线程池避免主线程阻塞
- 每 5 秒检测一次 CPU 使用率
- 根据 CPU 使用率动态调整并发数
- 保持在 MIN_WORKERS 和 MAX_WORKERS 之间

### 错误处理

- 所有错误都会被捕获并记录
- 加密文件单独记录到 `lock.json`
- 其他错误记录到 `error.json`
- 不会因为单个文件失败而中断整体流程
