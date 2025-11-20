# Local LLM Tool Sets

## 📦 Packages

### 🌐 Translator
本地 LLM 翻译代理服务器，More on [《💻 本地部署 Qwen 翻译网页》](https://lionad.art/articles/local-translator)

```bash
pnpm start:translate
```

### 📄 HTML2MD
HTML 转 Markdown 批量转换工具

```bash
pnpm start:html2md
```

### 📑 PDF2MD
PDF 转 Markdown 批量转换工具（支持 OCR）

```bash
# 自动检测模式
pnpm start:pdf2md

# 强制使用 OCR
pnpm start:pdf2md:ocr

# 禁用 OCR
pnpm start:pdf2md:no-ocr
```

详见: [packages/pdf2md/README.md](packages/pdf2md/README.md)

### 📝 MD2TXT
Markdown 转纯文本批量转换工具

```bash
pnpm start:md2txt
```

详见: [packages/md2txt/README.md](packages/md2txt/README.md)
