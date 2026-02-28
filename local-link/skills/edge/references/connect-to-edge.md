# Connect to Microsoft Edge via CDP

This guide explains how to start Edge with remote debugging enabled and connect to it via Playwright.

## Overview

Microsoft Edge (like Chrome) supports the Chrome DevTools Protocol (CDP), which allows external tools to connect and control the browser. This is useful for:

- Using existing login sessions and cookies
- Accessing saved passwords
- Bypassing CAPTCHAs that have already been solved
- Debugging and automation

## Starting Edge with Remote Debugging

### macOS

```bash
# Kill existing Edge processes
pkill -f "Microsoft Edge"

# Start Edge with remote debugging on port 9222
/Applications/Microsoft\ Edge.app/Contents/MacOS/Microsoft\ Edge \
  --remote-debugging-port=9222 \
  --restore-last-session
```

### Windows

```powershell
# Kill existing Edge processes
taskkill /F /IM msedge.exe

# Start Edge with remote debugging
"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" `
  --remote-debugging-port=9222 `
  --restore-last-session
```

### Linux

```bash
# Kill existing Edge processes
pkill -f "microsoft-edge"

# Start Edge with remote debugging
microsoft-edge \
  --remote-debugging-port=9222 \
  --restore-last-session
```

## Verifying Connection

After starting Edge, verify the debugging endpoint is available:

```bash
curl -s http://localhost:9222/json/version
```

Expected response:
```json
{
  "Browser": "Edg/145.0.3800.70",
  "Protocol-Version": "1.3",
  "User-Agent": "Mozilla/5.0 ...",
  "webSocketDebuggerUrl": "ws://localhost:9222/devtools/browser/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

## Connecting via Playwright

### Get WebSocket URL

```bash
WS_URL=$(curl -s http://localhost:9222/json/version | grep -o 'ws://[^"]*')
echo $WS_URL
# Output: ws://localhost:9222/devtools/browser/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### Python Code

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    # Connect to running Edge instance
    browser = p.chromium.connect_over_cdp(
        "ws://localhost:9222/devtools/browser/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    )

    # Get default context (the user's normal browsing context)
    context = browser.contexts[0]

    # Get existing pages or create new one
    pages = context.pages
    if pages:
        page = pages[0]
    else:
        page = context.new_page()

    # Navigate and interact
    page.goto("https://example.com")
    print(page.title())
```

## Troubleshooting

### Port Already in Use

If port 9222 is already in use:

```bash
# Find process using port 9222
lsof -i :9222  # macOS/Linux
netstat -ano | findstr :9222  # Windows

# Kill the process or use a different port
```

### Connection Refused

1. Ensure Edge was started with `--remote-debugging-port=9222`
2. Check firewall settings
3. Try accessing `http://localhost:9222` in a browser

### No Pages Available

If `context.pages` is empty:

```python
# Create a new page
page = context.new_page()
page.goto("https://example.com")
```

### WebSocket URL Expired

The WebSocket URL is session-based. If connection fails:

1. Get a fresh URL: `curl -s http://localhost:9222/json/version`
2. Use the new `webSocketDebuggerUrl`

## Security Considerations

⚠️ **Warning**: Enabling remote debugging allows any local application to control your browser.

- Only use on trusted networks
- Don't expose port 9222 to the internet
- Close Edge when automation is complete

## Alternative: Launch Edge Directly from Playwright

If you don't need the user's existing session, you can launch Edge directly:

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(
        channel="msedge",  # Use installed Edge
        headless=False
    )
    page = browser.new_page()
    page.goto("https://example.com")
```

This launches a fresh Edge instance without the user's cookies/passwords.
