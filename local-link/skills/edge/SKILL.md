---
name: edge
description: "通过 CDP (Chrome DevTools Protocol) 连接用户的 Edge 浏览器，利用现有的登录会话、Cookie 和保存的密码进行自动化操作。使用场景：(1) 用户希望在 Edge 中使用现有登录状态自动执行任务，(2) 网站需要登录/CAPTCHA 但用户已在 Edge 中解决，(3) 用户明确提到使用 Edge 浏览器，(4) 需要通过使用现有浏览器会话来绕过身份验证。"
---

## Important

* 禁止关闭现有 Edge 进程
* 应当使用 Edge，禁止使用 Chrome

## Workflow

1. 检查 Edge Chrome Devtools 端口是否正常运行

```bash
curl -s http://127.0.0.1:9333/json/version

# success response example
# {
#  "Browser": "Edg/145.0.3800.97",
#  "Protocol-Version": "1.3",
#  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0",
#  "V8-Version": "14.5.40.9",
#  "WebKit-Version": "537.36 (@f4c49d5241f148220b99eb7f045ac370a1694a15)",
#  "webSocketDebuggerUrl": "ws://127.0.0.1:9333/devtools/browser/d384a2e4-8bc0-4a1a-8f98-e7325d4ea55c"
# }
```

返回空或0，则表示 9333 没有运行。

如果返回结果显示 9333 端口正常运行，接下来直接使用 `chrome-devtools` 或 MCP 工具完成用户的需求，不必关心后续 prepare env 等步骤。

2.1 prepare env

```bash
mkdir -p "$HOME/.config/edge/Default"
cp -R "/Users/lionad/Library/Application Support/Microsoft Edge/Default" "$HOME/.config/edge/Default"
```

2.2 open a edge instance

```bash
nohup /Applications/Microsoft\ Edge.app/Contents/MacOS/Microsoft\ Edge \
    --remote-allow-origins=http://localhost:9333 \
    --remote-debugging-port=9333 \
    --user-data-dir="$HOME/.config/edge"
```
