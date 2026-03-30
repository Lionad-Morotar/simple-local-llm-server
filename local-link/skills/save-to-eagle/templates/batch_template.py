#!/usr/bin/env python3
"""
批量归档 Pixiv 作品到 Eagle，带反爬虫速率限制

使用方式:
    python batch_pixiv.py
"""
import sys
import time
import random
from pathlib import Path

scripts_dir = Path(__file__).parent / "scripts"
sys.path.insert(0, str(scripts_dir))

from pixiv import archive_pixiv

# 要归档的 URL 列表: (url, star)
URLS = [
    # example
    # ("https://www.pixiv.net/artworks/142542530", 4),
]

def main():
    total = len(URLS)
    print(f"📦 共 {total} 个 Pixiv 作品需要归档")
    print(f"⏱️  速率限制: 每个作品之间随机延迟 4-8 秒（约每分钟 8-10 张）")
    print("=" * 50)

    success = 0
    failed = []

    for i, (url, star) in enumerate(URLS, 1):
        print(f"\n[{i}/{total}] 开始归档...")
        try:
            archive_pixiv(url, star=star)
            success += 1
            print(f"   ✅ 成功 ({i}/{total})")
        except Exception as e:
            print(f"   ❌ 失败: {e}")
            failed.append((url, str(e)))

        if i < total:
            delay = random.uniform(4.0, 8.0)
            print(f"   ⏳ 等待 {delay:.1f} 秒...")
            time.sleep(delay)

    print("\n" + "=" * 50)
    print(f"归档完成 ✅")
    print(f"成功: {success}/{total}")
    if failed:
        print(f"失败: {len(failed)}")
        for url, err in failed:
            print(f"  - {url}: {err}")

if __name__ == "__main__":
    main()