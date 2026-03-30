#!/usr/bin/env python3
"""
save-to-eagle 批量归档脚本

带反爬虫速率限制的批量归档模式。当 URL 数量 > 6 时自动启用。

使用方式:
    # 从 JSON 文件批量归档
    python batch_archive.py --input urls.json

    # 直接传入多个 URL
    python batch_archive.py --urls "url1" "url2" --stars 4 5

JSON 格式示例:
    [
        {"url": "https://www.pixiv.net/artworks/123456", "star": 4},
        {"url": "https://www.pixiv.net/artworks/123457", "star": 5}
    ]
"""
import sys
import json
import time
import random
import asyncio
import argparse
from pathlib import Path
from datetime import datetime

# 添加脚本目录到路径
scripts_dir = Path(__file__).parent
sys.path.insert(0, str(scripts_dir))

from pixiv import archive_pixiv
from behance import archive_behance, extract_project_data


def detect_platform(url: str) -> str:
    """检测 URL 所属平台"""
    url_lower = url.lower()
    if "pixiv.net" in url_lower:
        return "pixiv"
    if "behance.net" in url_lower:
        return "behance"
    return None


def create_batch_template():
    """创建批量归档的模板文件"""
    template = [
        {"url": "https://www.pixiv.net/artworks/123456", "star": 4},
        {"url": "https://www.pixiv.net/artworks/123457", "star": 5},
        {"url": "https://www.behance.net/gallery/123456", "star": 3},
    ]

    template_path = Path("batch_template.json")
    template_path.write_text(json.dumps(template, ensure_ascii=False, indent=2))
    print(f"✅ 模板已创建: {template_path.absolute()}")
    print("请编辑该文件，填入你的 URL 列表后再执行批量归档")
    return template_path


async def archive_single(url: str, star: int = 0, single: bool = False):
    """归档单个 URL"""
    platform = detect_platform(url)

    if not platform:
        raise ValueError(f"不支持的 URL: {url}")

    if platform == "pixiv":
        return archive_pixiv(url, star, single=single)
    elif platform == "behance":
        behance_data = await extract_project_data(url)
        return archive_behance(url, star, behance_data)


async def batch_archive(
    items: list,
    delay_min: float = 4.0,
    delay_max: float = 8.0,
    single: bool = False,
    log_file: str = None
):
    """
    批量归档，带速率限制

    Args:
        items: URL 列表，格式为 [{"url": "...", "star": 4}, ...]
        delay_min: 最小延迟（秒）
        delay_max: 最大延迟（秒）
        single: 仅下载第一张图（仅 Pixiv 多图作品有效）
        log_file: 日志文件路径（可选）
    """
    total = len(items)
    print(f"📦 共 {total} 个作品需要归档")
    print(f"⏱️  速率限制: 每个作品间隔 {delay_min}-{delay_max} 秒")
    print(f"🕐 预计耗时: {total * (delay_min + delay_max) / 2 / 60:.1f} 分钟")
    print("=" * 50)

    success = 0
    failed = []
    results = []

    for i, item in enumerate(items, 1):
        url = item.get("url", item.get("link", ""))
        star = item.get("star", item.get("rating", 0))

        print(f"\n[{i}/{total}] {url}")

        try:
            result = await archive_single(url, star=star, single=single)
            success += 1
            results.append({"url": url, "status": "success", "result": result})
            print(f"   ✅ 成功 ({i}/{total})")
        except Exception as e:
            error_msg = str(e)
            print(f"   ❌ 失败: {error_msg}")
            failed.append({"url": url, "error": error_msg})
            results.append({"url": url, "status": "failed", "error": error_msg})

        # 延迟（最后一个不等待）
        if i < total:
            delay = random.uniform(delay_min, delay_max)
            print(f"   ⏳ 等待 {delay:.1f} 秒...")
            time.sleep(delay)

    # 输出结果
    print("\n" + "=" * 50)
    print(f"归档完成 ✅")
    print(f"成功: {success}/{total}")
    print(f"失败: {len(failed)}")

    if failed:
        print("\n失败列表:")
        for f in failed:
            print(f"  - {f['url']}: {f['error']}")

    # 保存日志
    if log_file:
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        log_data = {
            "timestamp": datetime.now().isoformat(),
            "total": total,
            "success": success,
            "failed": len(failed),
            "results": results
        }
        log_path.write_text(json.dumps(log_data, ensure_ascii=False, indent=2))
        print(f"\n📝 日志已保存: {log_path}")

    return {
        "total": total,
        "success": success,
        "failed": len(failed),
        "results": results
    }


def main():
    parser = argparse.ArgumentParser(description="批量归档网络图片到 Eagle 素材库")
    parser.add_argument("--input", "-i", type=str, help="JSON 文件路径，包含 URL 列表")
    parser.add_argument("--urls", "-u", nargs="+", help="直接传入 URL 列表")
    parser.add_argument("--stars", "-s", nargs="+", type=int, help="评分列表（与 --urls 一一对应）")
    parser.add_argument("--delay-min", type=float, default=4.0, help="最小延迟（秒，默认 4）")
    parser.add_argument("--delay-max", type=float, default=8.0, help="最大延迟（秒，默认 8）")
    parser.add_argument("--single", action="store_true", help="仅下载第一张图")
    parser.add_argument("--log", "-l", type=str, help="日志文件路径")
    parser.add_argument("--template", action="store_true", help="创建模板文件")

    args = parser.parse_args()

    # 创建模板
    if args.template:
        create_batch_template()
        return

    # 读取 URL 列表
    items = []

    if args.input:
        input_path = Path(args.input)
        if not input_path.exists():
            print(f"❌ 输入文件不存在: {input_path}")
            sys.exit(1)

        data = json.loads(input_path.read_text())

        # 支持两种格式：数组或对象
        if isinstance(data, list):
            items = data
        elif isinstance(data, dict) and "urls" in data:
            items = data["urls"]
        else:
            print("❌ JSON 格式错误，应为数组或包含 'urls' 键的对象")
            sys.exit(1)

    elif args.urls:
        stars = args.stars or [0] * len(args.urls)
        if len(stars) != len(args.urls):
            print("❌ --stars 数量必须与 --urls 数量一致")
            sys.exit(1)

        items = [{"url": url, "star": star} for url, star in zip(args.urls, stars)]

    else:
        print("❌ 请提供 --input 或 --urls 参数")
        print(f"用法: python {__file__} --input urls.json")
        print(f"      python {__file__} --urls 'url1' 'url2' --stars 4 5")
        print(f"      python {__file__} --template  # 创建模板")
        sys.exit(1)

    if not items:
        print("❌ URL 列表为空")
        sys.exit(1)

    # 执行批量归档
    try:
        asyncio.run(batch_archive(
            items,
            delay_min=args.delay_min,
            delay_max=args.delay_max,
            single=args.single,
            log_file=args.log
        ))
    except KeyboardInterrupt:
        print("\n\n⚠️ 用户中断")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 批量归档失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()