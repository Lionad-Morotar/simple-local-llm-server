#!/usr/bin/env python3
"""
Behance 项目归档到 Eagle
"""
import re
import json
from pathlib import Path
from urllib.parse import urlparse
from eagle_utils import (
    LIBRARY_ROOT,
    FOLDER_IDS,
    create_eagle_asset,
    create_subfolder,
    rebuild_mtime_index,
    sanitize_filename,
    download_image
)

# Behance 分类映射
FIELD_MAP = {
    "Illustration": "插图",
    "Graphic Design": "图形设计",
    "Branding": "图形设计",
    "Label Design": "图形设计",
    "Photography": "摄影",
    "UI/UX": "UI/UX",
    "Motion Graphics": "动画",
    "Typography": "字体设计",
    "3D Art": "3D Art",
    "Architecture": "建筑",
    "Fashion": "时尚",
    "Advertising": "广告",
    "Fine Arts": "美术",
    "Crafts": "手工艺",
    "Game Design": "游戏设计",
}


def extract_project_info(url: str) -> dict:
    """
    从 Behance 项目 URL 提取信息
    返回: {"id": ..., "slug": ...}
    """
    # URL 格式: https://www.behance.net/gallery/{id}/{slug}
    pattern = r"behance\.net/gallery/(\d+)/([^/?]+)"
    match = re.search(pattern, url)

    if not match:
        raise ValueError(f"无法解析 Behance URL: {url}")

    return {
        "id": match.group(1),
        "slug": match.group(2)
    }


def get_target_folder_id(creative_field: str) -> str:
    """
    根据 Creative Field 获取目标文件夹 ID
    """
    chinese_name = FIELD_MAP.get(creative_field, "插图")  # 默认插图
    folder_id = FOLDER_IDS["Behance"].get(chinese_name)

    if not folder_id:
        raise ValueError(f"找不到文件夹: {chinese_name}")

    return folder_id


def archive_behance(url: str, star: int, project_data: dict):
    """
    归档 Behance 项目到 Eagle

    Args:
        url: Behance 项目 URL
        star: 评分（1-5星，0表示无评分）
        project_data: 从浏览器提取的项目数据
            {
                "title": "项目名称",
                "creativeField": "Illustration",
                "author": "作者名",
                "images": [
                    {"src": "图片URL", "alt": "描述", "width": 1400, "height": 900}
                ]
            }
    """
    print(f"🎨 正在归档 Behance 项目...")
    print(f"   URL: {url}")

    title = project_data.get("title", "Unknown")
    creative_field = project_data.get("creativeField", "")
    author = project_data.get("author", "Unknown")
    images = project_data.get("images", [])

    print(f"   标题: {title}")
    print(f"   作者: {author}")
    print(f"   分类: {creative_field}")
    print(f"   图片数: {len(images)}")

    if not images:
        raise ValueError("没有找到可下载的图片")

    # 确定目标文件夹
    target_folder_id = get_target_folder_id(creative_field)
    print(f"\n📁 目标文件夹: {FIELD_MAP.get(creative_field, creative_field)}")

    # 创建项目子文件夹
    safe_name = sanitize_filename(title, max_len=60)
    project_folder_id = create_subfolder(
        target_folder_id,
        safe_name,
        description=f"作者: {author}"
    )
    print(f"   创建项目文件夹: {safe_name}")

    # 下载所有图片
    temp_dir = Path("/tmp/behance_download")
    temp_dir.mkdir(exist_ok=True)

    downloaded = []
    failed = []

    print(f"\n📥 开始下载 {len(images)} 张图片...")

    for i, img_info in enumerate(images, 1):
        try:
            # 获取原图 URL
            src = img_info.get("src", "")
            # 替换为最大可用尺寸 (1400px 是 Behance 支持的最大尺寸)
            # 注意：/original/ 路径不存在，使用 /1400/ 作为最大尺寸
            src = src.replace("/max_632_webp/", "/1400_webp/")
            src = src.replace("/max_632/", "/1400/")
            # 如果已经是 /1400/ 或 /1400_webp/，保持不变
            # 移除 _webp 后缀获取 JPG 版本（兼容性更好）
            src = src.replace("/1400_webp/", "/1400/")

            alt = img_info.get("alt", "")

            # 确定文件名
            if alt and len(alt) < 50:
                img_name = sanitize_filename(alt)
            else:
                img_name = f"{safe_name} - {i}"

            # 下载
            ext = src.split(".")[-1].split("?")[0]
            if ext not in ["jpg", "jpeg", "png", "webp"]:
                ext = "jpg"

            temp_path = temp_dir / f"img_{i}.{ext}"
            download_image(
                src,
                temp_path,
                headers={"Referer": "https://www.behance.net/"}
            )

            # 创建 Eagle 资源
            metadata = create_eagle_asset(
                image_path=temp_path,
                name=img_name,
                folder_id=project_folder_id,
                source_url=src,
                annotation=f"作者: {author}",
                tags=[],
                star=star
            )

            downloaded.append({
                "name": img_name,
                "width": metadata["width"],
                "height": metadata["height"],
                "size": metadata["size"]
            })

            print(f"   ✅ {img_name}")

        except Exception as e:
            failed.append({"index": i, "error": str(e)})
            print(f"   ❌ 图片 {i} 下载失败: {e}")

    # 重建索引
    rebuild_mtime_index()

    # 清理临时文件
    import shutil
    shutil.rmtree(temp_dir, ignore_errors=True)

    # 返回结果
    return {
        "platform": "Behance",
        "title": title,
        "author": author,
        "creative_field": creative_field,
        "url": url,
        "downloaded": downloaded,
        "failed": failed
    }
