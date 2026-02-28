# 网页屏幕录制指南

通用网页屏幕录制功能，支持录制页面动画和自动滚动长页面。

## 触发条件

用户在归档 URL 时可能说：
- "录制网页视频"
- "录制页面动画"
- "滚动录制整个页面"
- "capture video of this page"

## 录制类型

### 1. 动画录制 (Animation Recording)

录制页面可见区域的动画，适用于 hero 动画、轮播图等。

**参数：**
- `duration`: 录制时长（秒），默认 10 秒
- `viewport`: 视口大小，默认 1440x900

**实现：**
```python
# 使用 Playwright 录制
context = await browser.new_context(
    record_video={"dir": output_dir, "size": viewport},
    viewport=viewport
)
page = await context.new_page()
await page.goto(url, wait_until="domcontentloaded")
await page.wait_for_timeout(duration * 1000)
await context.close()  # 视频自动保存
```

### 2. 滚动录制 (Scrolling Capture)

自动滚动页面并录制，适用于长页面、落地页等。

**参数：**
- `scroll_delay`: 每次滚动后等待时间（毫秒），默认 500ms
- `scroll_step`: 每次滚动像素，默认 800px

**实现：**
```python
# 滚动并录制
await page.goto(url, wait_until="domcontentloaded")

# 获取页面高度
height = await page.evaluate("() => document.body.scrollHeight")

# 逐步滚动
current = 0
while current < height:
    await page.evaluate(f"() => window.scrollTo(0, {current})")
    await page.wait_for_timeout(scroll_delay)
    current += scroll_step
```

## 输出格式

- **视频**: WebM (VP9 编码)，可通过 ffmpeg 转换为 MP4/GIF
- **截图**: PNG 格式全页面截图

## 与 Eagle 归档结合

录制完成后，可将视频作为资源归档到 Eagle：

1. 录制视频保存到临时目录
2. 使用 `eagle_utils.create_eagle_asset()` 创建资源
3. 设置合适的文件夹（如 "网页录制" 或按网站分类）
4. 在 annotation 中记录原始 URL 和录制参数

## 技术要点

1. **连接 Edge**: 通过 CDP 连接用户已有的 Edge 浏览器，保留登录状态
2. **视频裁剪**: 使用 ffmpeg 裁剪所需片段
   ```bash
   ffmpeg -i input.webm -ss 00:00:00 -t 5 -c copy output.webm
   ```
3. **格式转换**: WebM 转 MP4/GIF
   ```bash
   # 转 MP4
   ffmpeg -i input.webm output.mp4
   # 转 GIF
   ffmpeg -i input.webm -vf "fps=30,scale=480:-1:flags=lanczos" output.gif
   ```
