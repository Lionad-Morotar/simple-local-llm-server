#!/usr/bin/env python3
"""
Pixiv 作品归档到 Eagle
"""
import json
import re
import requests
from pathlib import Path
from urllib.parse import urlparse
from eagle_utils import (
    LIBRARY_ROOT,
    FOLDER_IDS,
    create_eagle_asset,
    create_subfolder,
    set_folder_cover,
    rebuild_mtime_index,
    sanitize_filename,
    download_image
)

# Pixiv cookies 文件路径
COOKIES_PATH = LIBRARY_ROOT / ".secrets" / "pixiv_cookies.json"


def load_cookies():
    """加载 Pixiv cookies"""
    if not COOKIES_PATH.exists():
        raise FileNotFoundError(
            f"Pixiv cookies 文件不存在: {COOKIES_PATH}\n"
            "请从浏览器导出 cookies 并保存到该位置"
        )

    cookies_data = json.loads(COOKIES_PATH.read_text())
    return {c["name"]: c["value"] for c in cookies_data}


def extract_artwork_id(url: str) -> str:
    """从 URL 提取作品 ID"""
    patterns = [
        r"pixiv\.net/artworks/(\d+)",
        r"pixiv\.net/member_illust\.php.*illust_id=(\d+)",
    ]

    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)

    raise ValueError(f"无法从 URL 提取作品 ID: {url}")


def fetch_artwork_info(artwork_id: str) -> dict:
    """获取 Pixiv 作品信息"""
    cookies = load_cookies()

    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
        "Referer": "https://www.pixiv.net/",
    }

    # 获取作品详情
    ajax_url = f"https://www.pixiv.net/ajax/illust/{artwork_id}"
    resp = requests.get(ajax_url, headers=headers, cookies=cookies)
    resp.raise_for_status()

    data = resp.json()
    if data.get("error"):
        raise Exception(f"Pixiv API 错误: {data.get('message', '未知错误')}")

    illust = data["body"]

    return {
        "id": artwork_id,
        "title": illust["illustTitle"],
        "author": illust["userName"],
        "author_id": illust["userId"],
        "page_count": illust["pageCount"],
        "urls": illust["urls"],
    }


def fetch_artwork_pages(artwork_id: str) -> list:
    """获取多图作品的所有页面 URL"""
    cookies = load_cookies()

    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
        "Referer": "https://www.pixiv.net/",
    }

    pages_url = f"https://www.pixiv.net/ajax/illust/{artwork_id}/pages"
    resp = requests.get(pages_url, headers=headers, cookies=cookies)
    resp.raise_for_status()

    data = resp.json()
    if data.get("error"):
        raise Exception(f"Pixiv API 错误: {data.get('message', '未知错误')}")

    return [page["urls"]["original"] for page in data["body"]]


def archive_pixiv(url: str, star: int = 0, single: bool = False):
    """
    归档 Pixiv 作品到 Eagle

    单图：直接放入 Pixiv 文件夹，文件名 = 标题
    多图：创建子文件夹，图片命名为 p1, p2...
    多图 + single=True：只下载第一张图，直接放入 Pixiv 文件夹

    Args:
        url: 作品链接
        star: 评分（1-5星，0表示无评分）
        single: 仅下载第一张图（仅 Pixiv 多图作品有效）
    """
    print(f"🎨 正在归档 Pixiv 作品...")
    print(f"   URL: {url}")

    # 提取作品 ID
    artwork_id = extract_artwork_id(url)
    print(f"   作品 ID: {artwork_id}")

    # 获取作品信息
    info = fetch_artwork_info(artwork_id)
    title = info["title"]
    author = info["author"]
    page_count = info["page_count"]

    print(f"   标题: {title}")
    print(f"   作者: {author}")
    print(f"   页数: {page_count}")

    # 准备下载
    pixiv_folder_id = FOLDER_IDS["Pixiv"]
    temp_dir = Path("/tmp/pixiv_download")
    temp_dir.mkdir(exist_ok=True)

    downloaded = []

    if page_count == 1 or single:
        # 单图模式：直接放入 Pixiv 文件夹
        if page_count == 1:
            print(f"\n📥 单图模式，直接归档到 Pixiv 文件夹")
            image_url = info["urls"]["original"]
        else:
            print(f"\n📥 多图作品，仅下载第一张图")
            # 获取第一张图的 URL
            page_urls = fetch_artwork_pages(artwork_id)
            image_url = page_urls[0]

        ext = image_url.split(".")[-1].split("?")[0]
        temp_path = temp_dir / f"image.{ext}"

        download_image(image_url, temp_path, headers={"Referer": "https://www.pixiv.net/"})

        safe_title = sanitize_filename(title)
        metadata = create_eagle_asset(
            image_path=temp_path,
            name=safe_title,
            folder_id=pixiv_folder_id,
            source_url=url,
            annotation=f"作者: {author}",
            tags=[],
            star=star
        )

        downloaded.append({
            "name": safe_title,
            "width": metadata["width"],
            "height": metadata["height"],
            "size": metadata["size"]
        })

        print(f"   ✅ {safe_title}.{ext}")

    else:
        # 多图：创建子文件夹
        print(f"\n📥 多图模式，创建子文件夹")

        safe_folder_name = sanitize_filename(f"{author} - {title}", max_len=60)
        subfolder_id = create_subfolder(
            pixiv_folder_id,
            safe_folder_name,
            description=f"作者: {author}"
        )
        print(f"   创建文件夹: {safe_folder_name}")

        # 获取所有页面 URL
        page_urls = fetch_artwork_pages(artwork_id)

        first_asset_id = None
        for i, image_url in enumerate(page_urls, 1):
            ext = image_url.split(".")[-1].split("?")[0]
            temp_path = temp_dir / f"p{i}.{ext}"

            download_image(image_url, temp_path, headers={"Referer": "https://www.pixiv.net/"})

            metadata = create_eagle_asset(
                image_path=temp_path,
                name=f"p{i}",
                folder_id=subfolder_id,
                source_url=url,
                annotation=f"作者: {author}",
                tags=[],
                star=star
            )

            # 记录第一张图的 asset_id 用于设置封面
            if i == 1:
                first_asset_id = metadata["id"]

            downloaded.append({
                "name": f"p{i}",
                "width": metadata["width"],
                "height": metadata["height"],
                "size": metadata["size"]
            })

            print(f"   ✅ p{i}: {metadata['width']}×{metadata['height']}")

        # 设置第一张图为文件夹封面
        if first_asset_id:
            set_folder_cover(subfolder_id, first_asset_id)

    # 重建索引
    rebuild_mtime_index()

    # 清理临时文件
    import shutil
    shutil.rmtree(temp_dir, ignore_errors=True)

    # 返回结果
    return {
        "platform": "Pixiv",
        "title": title,
        "author": author,
        "url": url,
        "page_count": page_count,
        "downloaded": downloaded
    }
