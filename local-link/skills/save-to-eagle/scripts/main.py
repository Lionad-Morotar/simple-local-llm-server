#!/usr/bin/env python3
"""
save-to-eagle 主入口
根据 URL 自动判断平台并归档到 Eagle

用法:
    python main.py <url> [--star N]
    python main.py "https://www.pixiv.net/artworks/123456" --star 3
"""
import sys
import argparse
from pathlib import Path

# 添加脚本目录到路径
scripts_dir = Path(__file__).parent
sys.path.insert(0, str(scripts_dir))

from pixiv import archive_pixiv
from behance import archive_behance


def detect_platform(url: str) -> str:
    """
    检测 URL 所属平台

    Returns:
        "pixiv" | "behance" | None
    """
    url_lower = url.lower()

    if "pixiv.net" in url_lower:
        return "pixiv"

    if "behance.net" in url_lower:
        return "behance"

    return None


def archive(url: str, star: int = 0, behance_data: dict = None, single: bool = False):
    """
    归档 URL 到 Eagle

    Args:
        url: 作品链接
        star: 评分（1-5星，0表示无评分）
        behance_data: Behance 项目数据（从浏览器提取），仅 Behance 需要
        single: 仅下载第一张图（仅 Pixiv 多图作品有效）

    Returns:
        归档结果字典
    """
    platform = detect_platform(url)

    if not platform:
        raise ValueError(f"不支持的 URL: {url}\n目前仅支持 Behance 和 Pixiv")

    if platform == "pixiv":
        return archive_pixiv(url, star, single=single)

    elif platform == "behance":
        if not behance_data:
            raise ValueError(
                "归档 Behance 需要提供项目数据\n"
                "请使用 Playwright 访问页面并提取项目信息"
            )
        return archive_behance(url, star, behance_data)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="归档网络图片到 Eagle 素材库")
    parser.add_argument("url", help="作品链接 (Behance 或 Pixiv)")
    parser.add_argument("--star", type=int, default=0, help="评分 (1-5星，默认为0)")
    parser.add_argument("--single", action="store_true", help="仅下载第一张图（仅 Pixiv 多图作品有效）")

    args = parser.parse_args()

    try:
        result = archive(args.url, star=args.star, single=args.single)

        print("\n" + "=" * 50)
        print("归档完成 ✅")
        print(f"平台: {result['platform']}")
        print(f"标题: {result['title']}")
        print(f"作者: {result['author']}")

        if result['platform'] == "Behance":
            print(f"分类: {result['creative_field']}")

        print(f"图片数: {len(result['downloaded'])}")

        if result.get('failed'):
            print(f"失败: {len(result['failed'])}")

        print("\n现在打开 Eagle 即可查看！")

    except Exception as e:
        print(f"\n❌ 归档失败: {e}")
        sys.exit(1)
