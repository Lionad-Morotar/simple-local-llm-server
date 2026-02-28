# Poppler 工具完整参考

基于 Debian man pages (https://manpages.debian.org/testing/poppler-utils/)

---

## 工具列表

| 工具 | 功能 | Man Page |
|------|------|----------|
| `pdftotext` | PDF 转纯文本 | [pdftotext.1](https://manpages.debian.org/testing/poppler-utils/pdftotext.1.en.html) |
| `pdftoppm` | PDF 转图片 (PPM/PNG/JPEG) | [pdftoppm.1](https://manpages.debian.org/testing/poppler-utils/pdftoppm.1.en.html) |
| `pdfimages` | 提取内嵌图片 | [pdfimages.1](https://manpages.debian.org/testing/poppler-utils/pdfimages.1.en.html) |
| `pdfinfo` | 显示文档元数据 | [pdfinfo.1](https://manpages.debian.org/testing/poppler-utils/pdfinfo.1.en.html) |
| `pdftohtml` | PDF 转 HTML | [pdftohtml.1](https://manpages.debian.org/testing/poppler-utils/pdftohtml.1.en.html) |
| `pdffonts` | 分析字体信息 | [pdffonts.1](https://manpages.debian.org/testing/poppler-utils/pdffonts.1.en.html) |
| `pdfseparate` | 拆分 PDF 页面 | [pdfseparate.1](https://manpages.debian.org/testing/poppler-utils/pdfseparate.1.en.html) |
| `pdfunite` | 合并 PDF | [pdfunite.1](https://manpages.debian.org/testing/poppler-utils/pdfunite.1.en.html) |

---

## pdftotext - PDF 转文本

```bash
pdftotext [options] PDF-file [text-file]
```

### 输出规则
- 不指定 `text-file` → 输出到 `file.txt`
- `text-file` 为 `-` → 输出到 stdout
- `PDF-file` 为 `-` → 从 stdin 读取

### 选项

| 选项 | 说明 |
|------|------|
| `-f number` | 起始页 |
| `-l number` | 结束页 |
| `-r number` | 分辨率 DPI (默认 72) |
| `-x number` | 裁剪区域左上角 X 坐标 |
| `-y number` | 裁剪区域左上角 Y 坐标 |
| `-W number` | 裁剪区域宽度 |
| `-H number` | 裁剪区域高度 |
| `-layout` | 保留物理布局 |
| `-fixed number` | 假设等宽文本 |
| `-raw` | 按内容流顺序 |
| `-nodiag` | 丢弃倾斜文本 |
| `-htmlmeta` | 生成 HTML (含元信息) |
| `-bbox` | 生成 XHTML (单词边界框) |
| `-bbox-layout` | 生成 XHTML (块/行/词边界框) |
| `-tsv` | 生成 TSV (边界框信息) |
| `-cropbox` | 使用裁剪框 |
| `-colspacing number` | 列间距阈值 |
| `-enc encoding` | 编码 (默认 UTF-8) |
| `-listenc` | 列出可用编码 |
| `-eol unix\|dos\|mac` | 换行符风格 |
| `-nopgbrk` | 不插入分页符 |
| `-opw password` | 所有者密码 |
| `-upw password` | 用户密码 |
| `-q` | 静默模式 |
| `-v` | 版本信息 |
| `-h` | 帮助 |

### 退出码

| 代码 | 含义 |
|------|------|
| 0 | 成功 |
| 1 | 打开 PDF 错误 |
| 2 | 打开输出文件错误 |
| 3 | PDF 权限错误 |
| 99 | 其他错误 |

---

## pdftoppm - PDF 转图片

```bash
pdftoppm [options] PDF-file PPM-root
```

### 页面选择

| 选项 | 说明 |
|------|------|
| `-f number` | 起始页 |
| `-l number` | 结束页 |
| `-o` | 仅奇数页 |
| `-e` | 仅偶数页 |
| `-singlefile` | 仅第一页 |
| `-forcenum` | 强制页码 |

### 分辨率与缩放

| 选项 | 说明 |
|------|------|
| `-r number` | DPI (默认 150) |
| `-rx number` | X 分辨率 |
| `-ry number` | Y 分辨率 |
| `-scale-to number` | 缩放长边 |
| `-scale-to-x number` | 水平缩放 |
| `-scale-to-y number` | 垂直缩放 |

### 裁剪

| 选项 | 说明 |
|------|------|
| `-x number` | 左上角 X |
| `-y number` | 左上角 Y |
| `-W number` | 宽度 |
| `-H number` | 高度 |
| `-sz number` | 正方形边长 |
| `-cropbox` | 使用裁剪框 |

### 输出格式

| 选项 | 说明 |
|------|------|
| `-mono` | 单色 PBM |
| `-gray` | 灰度 PGM |
| `-png` | PNG |
| `-jpeg` | JPEG |
| `-jpegopt options` | JPEG 选项 |
| `-tiff` | TIFF |
| `-tiffcompression type` | TIFF 压缩 |

### JPEG 选项

格式：`-jpegopt "opt=val,opt=val"`

| 选项 | 说明 |
|------|------|
| `quality=n` | 质量 (0-100) |
| `progressive=y\|n` | 渐进式 |
| `optimize=y\|n` | 优化霍夫曼编码 |

### 颜色管理

| 选项 | 说明 |
|------|------|
| `-displayprofile file` | 显示 ICC 配置文件 |
| `-defaultgrayprofile file` | DefaultGray 色彩空间 |
| `-defaultrgbprofile file` | DefaultRGB 色彩空间 |
| `-defaultcmykprofile file` | DefaultCMYK 色彩空间 |

### 渲染

| 选项 | 说明 |
|------|------|
| `-freetype yes\|no` | FreeType (默认 yes) |
| `-thinlinemode` | 细线模式 |
| `-aa yes\|no` | 字体抗锯齿 |
| `-aaVector yes\|no` | 向量抗锯齿 |
| `-hide-annotations` | 隐藏注释 |

---

## pdfimages - 提取图片

```bash
pdfimages [options] PDF-file image-root
```

### 选项

| 选项 | 说明 |
|------|------|
| `-f number` | 起始页 |
| `-l number` | 结束页 |
| `-png` | PNG 格式 |
| `-tiff` | TIFF 格式 |
| `-j` | JPEG 保持原格式 |
| `-jp2` | JPEG2000 保持原格式 |
| `-jbig2` | JBIG2 保持原格式 |
| `-ccitt` | CCITT 保持原格式 |
| `-all` | 全部按原生格式 |
| `-list` | 仅列出信息 |
| `-p` | 文件名包含页码 |
| `-print-filenames` | 打印文件名 |
| `-opw password` | 所有者密码 |
| `-upw password` | 用户密码 |
| `-q` | 静默模式 |

---

## pdfinfo - 文档信息

```bash
pdfinfo [options] PDF-file
```

### 选项

| 选项 | 说明 |
|------|------|
| `-f number` | 指定页面 |
| `-l number` | 最后页面 |
| `-isodates` | ISO 8601 日期 |
| `-rawdates` | 原始日期字符串 |
| `-dests` | 打印命名目的地 |
| `-enc encoding` | 编码 |
| `-listenc` | 列出编码 |
| `-opw password` | 所有者密码 |
| `-upw password` | 用户密码 |
| `-v` | 版本信息 |

### 输出字段

- Title, Subject, Keywords, Author, Creator, Producer
- CreationDate, ModDate
- Tagged, UserProperties, Suspects
- Form, JavaScript
- Pages, Encrypted, Page size, Page rot
- File size, Optimized, PDF version

---

## pdftohtml - PDF 转 HTML

```bash
pdftohtml [options] PDF-file [html-file]
```

### 选项

| 选项 | 说明 |
|------|------|
| `-f number` | 起始页 |
| `-l number` | 结束页 |
| `-q` | 静默模式 |
| `-s` | 单页 HTML |
| `-xml` | XML 输出 |
| `-i` | 忽略图片 |
| `-noframes` | 无框架 |
| `-stdout` | 输出到 stdout |
| `-zoom ratio` | 缩放 (默认 1.5) |
| `-enc encoding` | 编码 |
| `-opw password` | 所有者密码 |
| `-upw password` | 用户密码 |
| `-hidden` | 输出隐藏文本 |
| `-nomerge` | 不合并段落 |
| `-nodrm` | 绕过 DRM |
| `-wbt number` | 单词间阈值 |

---

## pdffonts - 字体分析

```bash
pdffonts [options] PDF-file
```

### 选项

| 选项 | 说明 |
|------|------|
| `-f number` | 起始页 |
| `-l number` | 结束页 |
| `-subst` | 列出可替代字体 |
| `-opw password` | 所有者密码 |
| `-upw password` | 用户密码 |
| `-v` | 版本信息 |

### 输出字段

- name, type, encoding, emb, sub, uni, object, ID

---

## pdfseparate - 拆分 PDF

```bash
pdfseparate [options] PDF-file pattern
```

### 选项

| 选项 | 说明 |
|------|------|
| `-f number` | 起始页 |
| `-l number` | 结束页 |
| `-v` | 版本信息 |

### 模式

使用 `%d` 表示页码，支持格式如 `%03d` 生成 `001` 样式的编号。

---

## pdfunite - 合并 PDF

```bash
pdfunite [options] PDF-file1 ... PDF-fileN output-file
```

### 选项

| 选项 | 说明 |
|------|------|
| `-v` | 版本信息 |

---

## 故障排除

### 中文乱码
```bash
pdftotext -enc UTF-8 input.pdf output.txt
```

### 扫描版 PDF
Poppler 无法直接提取扫描版 PDF 文本，需 OCR：
```bash
pdftoppm -png input.pdf page
tesseract page-1.png output -l chi_sim+eng
```

### 权限错误 (exit code 3)
- 检查 PDF 是否加密
- 使用 `-opw` 或 `-upw` 提供密码

### 命令未找到 (macOS)
```bash
export PATH="/opt/homebrew/opt/poppler/bin:$PATH"
```
