#!/usr/bin/env python3
"""
网页屏幕录制工具
支持动画录制和滚动录制

用法:
    python record_webpage.py <url> [options]
    python record_webpage.py "https://boardmix.cn" --duration 10 --output ./videos/
    python record_webpage.py "https://example.com" --scroll --output ./captures/
"""
import argparse
import asyncio
import json
from pathlib import Path
from urllib.parse import urlparse

try:
    from playwright.async_api import async_playwright
except ImportError:
    print("错误: 需要安装 playwright")
    print("运行: pip install playwright && playwright install chromium")
    raise


async def get_edge_ws_url(port: int = 9222) -> str:
    """获取 Edge 的 WebSocket 调试 URL"""
    import urllib.request
    try:
        with urllib.request.urlopen(f"http://localhost:{port}/json/version", timeout=5) as resp:
            data = json.loads(resp.read())
            return data.get("webSocketDebuggerUrl", "")
    except Exception as e:
        print(f"无法连接到 Edge: {e}")
        print(f"请确保 Edge 已启动远程调试: --remote-debugging-port={port}")
        raise


async def record_animation(
    url: str,
    output_dir: Path,
    duration: int = 10,
    viewport: tuple = (1440, 900),
    wait_time: int = 2
) -> Path:
    """
    录制页面动画

    Args:
        url: 目标网页 URL
        output_dir: 输出目录
        duration: 录制时长（秒）
        viewport: 视口大小 (width, height)
        wait_time: 页面加载后等待时间（秒）

    Returns:
        保存的视频文件路径
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    ws_url = await get_edge_ws_url()

    async with async_playwright() as p:
        # 连接到 Edge
        browser = await p.chromium.connect_over_cdp(ws_url)

        # 创建带录制的 context
        context = await browser.new_context(
            record_video={
                "dir": str(output_dir),
                "size": {"width": viewport[0], "height": viewport[1]}
            },
            viewport={"width": viewport[0], "height": viewport[1]}
        )

        page = await context.new_page()

        print(f"正在加载页面: {url}")
        await page.goto(url, wait_until="domcontentloaded", timeout=60000)

        # 等待动画加载
        print(f"等待 {wait_time} 秒让动画加载...")
        await asyncio.sleep(wait_time)

        print(f"开始录制，持续 {duration} 秒...")
        await asyncio.sleep(duration)

        # 关闭 context，视频自动保存
        await context.close()
        await browser.close()

    # 查找生成的视频文件
    video_files = sorted(output_dir.glob("*.webm"), key=lambda x: x.stat().st_mtime, reverse=True)
    if video_files:
        # 重命名为有意义的文件名
        domain = urlparse(url).netloc.replace("www.", "").replace(".", "_")
        new_name = output_dir / f"{domain}_{duration}s.webm"
        video_files[0].rename(new_name)
        print(f"视频已保存: {new_name}")
        return new_name
    else:
        raise RuntimeError("未找到录制的视频文件")


async def capture_full_page(
    url: str,
    output_dir: Path,
    viewport: tuple = (1440, 900),
    scroll_step: int = 800,
    scroll_delay: float = 0.5
) -> list[Path]:
    """
    滚动捕获整个页面（截图方式）

    Args:
        url: 目标网页 URL
        output_dir: 输出目录
        viewport: 视口大小
        scroll_step: 每次滚动像素
        scroll_delay: 每次滚动后等待时间（秒）

    Returns:
        截图文件路径列表
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    ws_url = await get_edge_ws_url()

    screenshots = []

    async with async_playwright() as p:
        browser = await p.chromium.connect_over_cdp(ws_url)
        context = await browser.new_context(viewport={"width": viewport[0], "height": viewport[1]})
        page = await context.new_page()

        print(f"正在加载页面: {url}")
        await page.goto(url, wait_until="networkidle", timeout=60000)

        # 获取页面高度
        page_height = await page.evaluate("() => document.body.scrollHeight")
        print(f"页面高度: {page_height}px")

        # 逐步滚动并截图
        current = 0
        part = 0
        domain = urlparse(url).netloc.replace("www.", "").replace(".", "_")

        while current < page_height:
            await page.evaluate(f"() => window.scrollTo(0, {current})")
            await asyncio.sleep(scroll_delay)

            screenshot_path = output_dir / f"{domain}_part{part:03d}.png"
            await page.screenshot(path=screenshot_path, full_page=False)
            screenshots.append(screenshot_path)

            print(f"截图 {part + 1}: {current}px - {screenshot_path.name}")

            current += scroll_step
            part += 1

        await context.close()
        await browser.close()

    print(f"共捕获 {len(screenshots)} 张截图")
    return screenshots


async def main():
    parser = argparse.ArgumentParser(description="网页屏幕录制工具")
    parser.add_argument("url", help="目标网页 URL")
    parser.add_argument("--output", "-o", default="./recordings", help="输出目录")
    parser.add_argument("--duration", "-d", type=int, default=10, help="录制时长（秒）")
    parser.add_argument("--viewport", "-v", default="1440x900", help="视口大小，如 1440x900")
    parser.add_argument("--scroll", "-s", action="store_true", help="滚动截图模式（而非视频录制）")
    parser.add_argument("--wait", "-w", type=int, default=2, help="页面加载后等待时间（秒）")

    args = parser.parse_args()

    # 解析 viewport
    width, height = map(int, args.viewport.split("x"))

    if args.scroll:
        # 滚动截图模式
        screenshots = await capture_full_page(
            args.url,
            Path(args.output),
            viewport=(width, height)
        )
        print(f"\n截图已保存到: {args.output}")
        for s in screenshots:
            print(f"  - {s.name}")
    else:
        # 视频录制模式
        video_path = await record_animation(
            args.url,
            Path(args.output),
            duration=args.duration,
            viewport=(width, height),
            wait_time=args.wait
        )
        print(f"\n视频已保存: {video_path}")


if __name__ == "__main__":
    asyncio.run(main())
