---
name: edge
description: "通过 CDP (Chrome DevTools Protocol) 连接用户的 Microsoft Edge 浏览器，利用现有的登录会话、Cookie 和保存的密码进行自动化操作。使用场景：(1) 用户希望在 Edge 中使用现有登录状态自动执行任务，(2) 网站需要登录/CAPTCHA 但用户已在 Edge 中解决，(3) 用户明确提到使用 Edge 浏览器，(4) 需要通过使用现有浏览器会话来绕过身份验证。"
---

# Edge 浏览器自动化

通过 Playwright CDP 连接用户的 Microsoft Edge 浏览器。

## 前置条件

Edge 必须以远程调试模式运行在 9222 端口。

**启动 Edge 并启用远程调试：**

> **注意**：
> 从 Chrome/Edge 136 开始，`--remote-debugging-port` 必须与 `--user-data-dir` 配合使用，指向非标准用户数据目录。
> 如果没有 ~/.config/edge 目录，应当询问用户“默认用户配置目录地址”，并使用 edge 浏览器打开 “edge://profile-internals/”，告知用户从页面中获取默认的 User Profile Directory
> 当用户继续输入内容时，检测是否是一个合法的目录，比如 “~/Library/Application Support/Microsoft Edge/Default”，如果是则 `ln -s <xxx> ~/.config/edge`

```bash
# link CDP to default User Profile
mkdir -p ~/.config/edge && ln -s "/Users/lionad/Library/Application Support/Microsoft Edge" "$HOME/.config/edge"
# macOS
/Applications/Microsoft\ Edge.app/Contents/MacOS/Microsoft\ Edge \
    --remote-allow-origins=http://localhost:9222 \
    --remote-debugging-port=9222 \
    --user-data-dir="$HOME/.config/edge"
```

## 连接方式（关键）

**必须使用 `connect_over_cdp()` - 不能用 `launch()`**

使用 `launch()` 会打开 Chrome 而不是连接 Edge。

```python
# 正确 - 连接到现有 Edge 实例
browser = playwright.chromium.connect_over_cdp("http://localhost:9222")

# 错误 - 会打开新的 Chrome 浏览器
browser = playwright.chromium.launch()
```

## 快速开始

```python
# 1. 连接 Edge
browser = playwright.chromium.connect_over_cdp("http://localhost:9222")

# 2. 获取现有上下文和页面
context = browser.contexts[0]
page = context.pages[0]  # 或使用 context.new_page()

# 3. 导航和交互
page.goto("https://example.com")
```

## 验证连接

在继续之前测试连接：

```bash
curl -s http://localhost:9222/json/version
```

成功响应包含 `webSocketDebuggerUrl`。

## 故障排除

| 问题 | 解决方案 |
|------|----------|
| 连接被拒绝 | Edge 未使用 `--remote-debugging-port=9222` 启动 |
| 上下文/页面为空 | Edge 没有打开窗口；使用 `context.new_page()` |
| 打开了错误的浏览器 | 确认使用 `connect_over_cdp()` 而非 `launch()` |

## 各平台路径

搜索前优先使用这些路径：

- **macOS**: `/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge`
- **Windows**: `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`
- **Linux**: `/usr/bin/microsoft-edge` 或 `/opt/microsoft/msedge/msedge`

## 常用脚本

- [获取打开的标签页](scripts/get-opened-pages.sh) - 通过 CDP API 列出所有打开的页面
- [获取页面结构](scripts/get_tree.py) - 解析页面无障碍树为精简的语义结构

## 参考资料

- 详细设置：[references/connect-to-edge.md](references/connect-to-edge.md)
