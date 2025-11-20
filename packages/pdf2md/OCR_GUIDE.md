# OCR 使用指南

## 快速开始

### 1. 自动检测模式（推荐）

系统会自动判断 PDF 是否需要 OCR：

```bash
pnpm start:pdf2md
```

输出示例：
```
📊 检测到文本版 PDF (平均每页 1250 字符)，无需 OCR
📄 使用标准模式提取文本...
✅ [1/1] document.pdf → document.md
```

或

```
📊 检测到扫描版 PDF (平均每页 45 字符)，将使用 OCR
🔍 使用 OCR 模式处理 PDF...
🔧 初始化 OCR 引擎 (语言: chi_sim+eng)...
✅ OCR 引擎初始化完成
📄 PDF 共 10 页，开始转换为图片...
🖼️  转换进度: 10/10 页
✅ 图片转换完成，共 10 张
🔍 开始 OCR 识别...
📝 识别第 1/10 页...
⏳ OCR 识别进度: 50%
✅ [1/1] scanned.pdf → scanned.md [OCR]
```

### 2. 强制 OCR 模式

即使是文本版 PDF 也使用 OCR：

```bash
USE_OCR=true pnpm start:pdf2md
```

### 3. 禁用自动检测

只使用标准文本提取，不使用 OCR：

```bash
AUTO_DETECT_OCR=false pnpm start:pdf2md
```

## 语言配置

### 常用配置

**简体中文 + 英文（默认）：**
```bash
pnpm start:pdf2md
# 或
OCR_LANGUAGE=chi_sim+eng pnpm start:pdf2md
```

**仅英文：**
```bash
OCR_LANGUAGE=eng pnpm start:pdf2md
```

**繁体中文 + 英文：**
```bash
OCR_LANGUAGE=chi_tra+eng pnpm start:pdf2md
```

**日文 + 英文：**
```bash
OCR_LANGUAGE=jpn+eng pnpm start:pdf2md
```

**韩文 + 英文：**
```bash
OCR_LANGUAGE=kor+eng pnpm start:pdf2md
```

### 多语言组合

可以同时识别多种语言，用 `+` 连接：

```bash
# 简体中文 + 繁体中文 + 英文
OCR_LANGUAGE=chi_sim+chi_tra+eng pnpm start:pdf2md

# 日文 + 英文 + 简体中文
OCR_LANGUAGE=jpn+eng+chi_sim pnpm start:pdf2md
```

## 高级用法

### 批量处理扫描版 PDF

```bash
# 1. 将所有扫描版 PDF 放入 .pdf 目录
cp ~/scanned-pdfs/*.pdf packages/pdf2md/.pdf/

# 2. 强制使用 OCR 批量处理
USE_OCR=true pnpm start:pdf2md
```

### 混合处理（自动检测）

```bash
# 目录中同时包含文本版和扫描版 PDF
# 系统会自动识别并分别处理
pnpm start:pdf2md
```

## 性能提示

### OCR 性能对比

| PDF 类型 | 页数 | 处理时间 | 模式 |
|----------|------|----------|------|
| 文本版 | 100 | ~10秒 | 标准提取 |
| 扫描版 | 100 | ~5-10分钟 | OCR |
| 混合版 | 100 | ~1-3分钟 | 自动检测 |

### 优化建议

1. **首次运行较慢**：OCR 引擎需要下载语言模型（约 10-20MB）
2. **并发处理**：OCR 模式下会自动降低并发数，避免内存不足
3. **清晰度要求**：建议扫描 DPI 不低于 300
4. **内存管理**：大文件 OCR 可能需要 1-2GB 内存

## 故障排查

### 问题：OCR 识别不准确

**可能原因：**
- PDF 扫描质量低
- 语言设置不匹配
- 文字模糊或倾斜

**解决方法：**
```bash
# 1. 检查原始 PDF 质量
# 2. 尝试不同的语言组合
OCR_LANGUAGE=chi_sim+eng pnpm start:pdf2md

# 3. 如果是繁体中文，使用 chi_tra
OCR_LANGUAGE=chi_tra+eng pnpm start:pdf2md
```

### 问题：OCR 运行缓慢

**解决方法：**
```bash
# 1. 减少并发处理的文件数量
# 每次只处理 5-10 个文件

# 2. 关闭其他占用 CPU 的程序

# 3. 考虑使用更强大的硬件
```

### 问题：内存不足

**解决方法：**
```bash
# 1. 一次处理较少的文件
# 2. 关闭其他程序释放内存
# 3. 增加系统交换空间
```

### 问题：首次运行需要下载语言包

这是正常现象，Tesseract.js 会自动下载所需的语言模型：

```
🔧 初始化 OCR 引擎 (语言: chi_sim+eng)...
下载中: chi_sim.traineddata.gz (12.3 MB)
下载中: eng.traineddata.gz (4.5 MB)
✅ OCR 引擎初始化完成
```

## 实战案例

### 案例 1：处理扫描的法律文件

```bash
# 中文法律文件（简体）
OCR_LANGUAGE=chi_sim pnpm start:pdf2md
```

### 案例 2：处理英文学术论文

```bash
# 纯英文文档
OCR_LANGUAGE=eng pnpm start:pdf2md
```

### 案例 3：处理中英混排文档

```bash
# 默认配置即可
pnpm start:pdf2md
```

### 案例 4：处理香港繁体文件

```bash
# 繁体中文 + 英文
OCR_LANGUAGE=chi_tra+eng pnpm start:pdf2md
```

## 技术细节

### OCR 检测逻辑

```typescript
// 自动检测算法
平均字符数/页 = 总字符数 / 总页数

if (平均字符数/页 < 100) {
  使用 OCR
} else {
  使用标准文本提取
}
```

### OCR 处理流程

```
1. PDF → 图片 (每页一张 PNG)
   ↓
2. 图片 → OCR 识别
   ↓
3. 文本 → 清理页眉页脚
   ↓
4. 文本 → Markdown 格式
   ↓
5. 清理临时文件
```

### 支持的语言列表

完整语言支持请参考：
- Tesseract.js 支持 100+ 种语言
- 常用语言已经过优化
- 可以自由组合使用

## 总结

- ✅ **简单**：自动检测，无需手动配置
- ✅ **智能**：自动判断是否需要 OCR
- ✅ **强大**：支持 100+ 种语言
- ✅ **灵活**：可强制启用或禁用 OCR
- ✅ **高效**：并发处理 + 智能优化
