#!/bin/bash
# 获取 Edge 浏览器当前打开的所有标签页
# 通过 CDP (Chrome DevTools Protocol) 连接本地调试端口

curl -s http://localhost:9222/json/list | python3 -c "
import json, sys

data = json.load(sys.stdin)

# 只过滤真正的页面标签（排除 iframe、service_worker、background_page 等）
pages = [p for p in data if p.get('type') == 'page']

print(f'共 {len(pages)} 个打开的标签页：\n')

for i, page in enumerate(pages, 1):
    title = page.get('title', '无标题')
    url = page.get('url', '')

    # 截断长文本以便阅读
    title_display = title[:60] + '...' if len(title) > 60 else title
    url_display = url[:80] + '...' if len(url) > 80 else url

    print(f'【{i}】{title_display}')
    print(f'    URL: {url_display}\n')
"
