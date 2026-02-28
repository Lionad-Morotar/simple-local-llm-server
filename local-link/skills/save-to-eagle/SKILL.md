---
name: save-to-eagle
description: "归档网络内容到 Eagle 素材库。支持：(1) Behance/Pixiv 图片归档，(2) 网页视频录制（页面动画、滚动录制）。使用方式：'归档 [URL]' 归档图片；'录制网页视频 [URL]' 录制页面动画；'滚动录制 [URL]' 自动滚动截图。支持评分如 '归档 [URL], 3/5'。"
---

# Save to Eagle

将网络内容归档到本地 Eagle 素材库。支持图片归档和网页屏幕录制。

## 功能概览

| 功能 | 触发方式 | 输出 |
|------|---------|------|
| **图片归档** | "归档 [URL]" | 下载原图到 Eagle |
| **视频录制** | "录制网页视频 [URL]" | WebM 视频文件 |
| **滚动截图** | "滚动录制 [URL]" | 多页 PNG 截图 |

## 使用方式

### 图片归档
- "归档 https://www.pixiv.net/artworks/141273594"
- "归档 https://www.pixiv.net/artworks/141273594, 3/5" (带评分)
- "保存这个 Behance 项目"

### 屏幕录制
- "录制网页视频 https://boardmix.cn" - 录制页面动画
- "滚动录制 https://example.com" - 自动滚动截图

**录制参数：**
- 默认视口: 1440x900
- 默认时长: 10 秒
- 输出格式: WebM (可用 ffmpeg 转 MP4/GIF)

详细录制指南见 [references/screen-recording.md](references/screen-recording.md)

## 参数解析（Claude 层处理）

当用户提供类似 `"归档 URL, 3/5"` 的输入时，Claude 应解析出 URL 和评分：

```python
import re

def parse_archive_args(user_input: str) -> tuple[str, int]:
    """
    解析归档参数

    Returns:
        (url, star)
    """
    # 匹配评分模式: ", 3/5" 或 ", 5"
    star_match = re.search(r',\s*(\d)(?:/\d)?\s*$', user_input)

    if star_match:
        star = int(star_match.group(1))
        star = max(0, min(5, star))  # 限制在 0-5
        url = user_input[:star_match.start()].strip()
    else:
        url = user_input.strip()
        star = 0

    return url, star

# 使用示例
url, star = parse_archive_args("https://www.pixiv.net/artworks/141349217, 3/5")
# url = "https://www.pixiv.net/artworks/141349217"
# star = 3
```

## 执行脚本

解析参数后，通过命令行调用脚本：

```bash
python scripts/main.py "<URL>" --star <N>
```

示例：
```bash
python scripts/main.py "https://www.pixiv.net/artworks/141349217" --star 3
```

## Pixiv 归档流程

### 1. 单图作品
- 直接放入 `Pixiv` 文件夹
- 文件名：作品标题
- 注释：作者信息

### 2. 多图作品
- 创建子文件夹：`Pixiv > {作者} - {标题}`
- 图片命名：`p1.jpg`, `p2.jpg`...
- 注释：作者信息

### 3. 认证方式
Pixiv 需要 cookies 文件：
- 路径：`{Eagle库}/.secrets/pixiv_cookies.json`
- 格式：Chrome/Firefox 导出的 cookies JSON 数组

## Behance 归档流程

### 1. 提取项目信息
使用 Playwright 访问页面，提取：
- 项目标题
- Creative Field（分类）
- 作者名
- 所有项目图片

```javascript
// 提取脚本
() => {
  const images = [];
  document.querySelectorAll('img').forEach((img) => {
    if (img.src && img.src.includes('mir-s3-cdn')) {
      images.push({
        src: img.src,
        alt: img.alt || '',
        width: img.width,
        height: img.height
      });
    }
  });

  const mainImages = images.filter(img =>
    img.src.includes('project_modules') &&
    !img.src.includes('/projects/404/')
  );

  return {
    title: document.querySelector('h1')?.textContent?.trim() || '',
    creativeField: document.querySelector('a[href*="field="]')?.textContent?.trim() || '',
    author: document.querySelector('[data-testid="profile-name"]')?.textContent?.trim() || '',
    images: mainImages
  };
}
```

### 2. 分类映射

| Creative Field | Eagle 文件夹 |
|---------------|-------------|
| Illustration | 插图 |
| Graphic Design | 图形设计 |
| Photography | 摄影 |
| UI/UX | UI/UX |
| Motion Graphics | 动画 |
| Typography | 字体设计 |
| 3D Art | 3D Art |
| Architecture | 建筑 |
| Fashion | 时尚 |
| Advertising | 广告 |
| Fine Arts | 美术 |
| Crafts | 手工艺 |
| Game Design | 游戏设计 |

### 3. 创建子文件夹
每个项目都会在其分类下创建独立的子文件夹。

## 元数据结构

所有归档的图片都包含完整的 Eagle 元数据：

```json
{
  "id": "Kxxxxxxxxxxxx",
  "name": "图片名称",
  "size": 2260783,
  "width": 1333,
  "height": 2000,
  "orientation": 1,
  "folders": ["文件夹ID"],
  "url": "原始链接",
  "annotation": "作者: xxx",
  "tags": [],
  "isDeleted": false,
  "star": 3
}
```

- `star`: 评分（1-5星，0表示无评分）

## 脚本位置

```
~/.claude/skills/save-to-eagle/scripts/
├── main.py              # 入口，URL 路由
├── pixiv.py             # Pixiv 归档逻辑
├── behance.py           # Behance 归档逻辑
├── eagle_utils.py       # 共用工具函数
└── record_webpage.py    # 网页屏幕录制
```

**录制脚本用法：**
```bash
# 录制页面动画（10秒）
python scripts/record_webpage.py "https://boardmix.cn" --duration 10

# 滚动截图
python scripts/record_webpage.py "https://example.com" --scroll
```

## 错误处理

- 所有错误直接抛出给用户
- 不自动重试失败的下载
- 不自动处理认证问题
