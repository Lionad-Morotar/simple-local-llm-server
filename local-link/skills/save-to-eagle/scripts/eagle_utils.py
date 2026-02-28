#!/usr/bin/env python3
"""
Eagle 素材库共用工具函数
"""
import json
import random
import string
import shutil
import requests
from pathlib import Path
from datetime import datetime
from PIL import Image

# 默认 Eagle 库路径
LIBRARY_ROOT = Path("/Users/lionad/Library/CloudStorage/OneDrive-Personal/素材/@/素材.library")

# 文件夹 ID 缓存
FOLDER_IDS = {
    "Pixiv": "KMTBCL1D9MF66",
    "Behance": {
        "插图": "7UAPMLRGTWT",
        "图形设计": "UWFE6X4QRC4",
        "摄影": "36QLX1XSJCC",
        "UI/UX": "LKC0V82UMSW",
        "动画": "25BUAQGOJFH",
        "3D Art": "6GIONKGOYTW",
        "建筑": "CQPDELSDAAY",
        "产品设计": "6FODRRZQTFO",
        "时尚": "SWHR57VFNM0",
        "广告": "JC3ZLIHEUSG",
        "美术": "KP2UWOJ4WDN",
        "手工艺": "PMQ8B3ODHKY",
        "游戏设计": "0JAUXK03C29",
        "声音": "ZS4GICO0BY8",
    }
}


def generate_eagle_id() -> str:
    """生成正确的 Eagle ID 格式 (13字符: K + 12位字母数字)"""
    chars = string.ascii_uppercase + string.ascii_lowercase + string.digits
    return 'K' + ''.join(random.choices(chars, k=12))


def generate_folder_id() -> str:
    """生成文件夹 ID (11-13 字符)"""
    chars = string.ascii_uppercase + string.ascii_lowercase + string.digits
    return ''.join(random.choices(chars, k=13))


def create_thumbnail(img_path: Path, thumb_path: Path, max_size=240):
    """创建保持原图比例的 Eagle 缩略图"""
    with Image.open(img_path) as img:
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        # 保持比例缩放到最大边为 max_size
        img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        # 直接保存，不添加白色背景，保持原图比例
        img.save(thumb_path, 'PNG')


def get_exif_orientation(img) -> int:
    """获取 EXIF 方向信息，默认为 1 (正常)"""
    try:
        exif = img._getexif()
        if exif and 274 in exif:
            return exif[274]
    except:
        pass
    return 1


def sanitize_filename(name: str, max_len: int = 80) -> str:
    """清理文件名，替换特殊字符为下划线"""
    result = ""
    for c in name:
        if c.isalnum() or c in ' -_()【】《》「」':
            result += c
        else:
            result += '_'
    return result[:max_len].strip()


def create_eagle_asset(
    image_path: Path,
    name: str,
    folder_id: str,
    source_url: str,
    annotation: str = "",
    tags: list = None,
    star: int = 0
) -> dict:
    """
    创建完整的 Eagle 资源

    Args:
        image_path: 图片文件路径
        name: 资源名称（不含扩展名）
        folder_id: 目标文件夹 ID
        source_url: 来源 URL
        annotation: 注释
        tags: 标签列表

    Returns:
        创建的元数据字典
    """
    # 生成资源 ID 和目录
    asset_id = generate_eagle_id()
    asset_dir = LIBRARY_ROOT / "images" / f"{asset_id}.info"
    asset_dir.mkdir(parents=True, exist_ok=True)

    # 获取扩展名
    ext = image_path.suffix.lstrip('.')
    if ext not in ['jpg', 'jpeg', 'png', 'webp', 'gif']:
        ext = 'jpg'

    # 清理文件名
    safe_name = sanitize_filename(name)

    # 复制图片到目标位置
    dest_path = asset_dir / f"{safe_name}.{ext}"
    shutil.copy2(image_path, dest_path)

    # 创建缩略图（必需）
    thumb_path = asset_dir / f"{safe_name}_thumbnail.png"
    create_thumbnail(dest_path, thumb_path)

    # 获取图片信息
    with Image.open(dest_path) as img:
        width, height = img.size
        orientation = get_exif_orientation(img)

    stat = dest_path.stat()
    now_ms = int(datetime.now().timestamp() * 1000)

    # 创建完整元数据
    metadata = {
        "id": asset_id,
        "name": safe_name,
        "size": stat.st_size,
        "btime": int(stat.st_birthtime * 1000),
        "mtime": int(stat.st_mtime * 1000),
        "ext": ext,
        "width": width,
        "height": height,
        "orientation": orientation,
        "modificationTime": now_ms,
        "lastModified": now_ms,
        "folders": [folder_id],
        "tags": tags or [],
        "isDeleted": False,
        "url": source_url,
        "annotation": annotation,
        "palettes": [],
        "star": star
    }

    # 保存元数据
    meta_path = asset_dir / "metadata.json"
    meta_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2))

    return metadata


def create_subfolder(parent_id: str, name: str, description: str = "") -> str:
    """
    在指定父文件夹下创建子文件夹

    Returns:
        新文件夹的 ID
    """
    metadata_path = LIBRARY_ROOT / "metadata.json"

    with open(metadata_path, 'r', encoding='utf-8') as f:
        metadata = json.load(f)

    folder_id = generate_folder_id()
    now_ms = int(datetime.now().timestamp() * 1000)

    new_folder = {
        "id": folder_id,
        "name": name,
        "description": description,
        "children": [],
        "modificationTime": now_ms,
        "tags": [],
        "password": "",
        "passwordTips": ""
    }

    # 递归查找父文件夹
    def find_and_add(folder_list):
        for folder in folder_list:
            if folder["id"] == parent_id:
                folder.setdefault("children", []).append(new_folder)
                return True
            if folder.get("children"):
                if find_and_add(folder["children"]):
                    return True
        return False

    if not find_and_add(metadata.get("folders", [])):
        raise ValueError(f"父文件夹 {parent_id} 未找到")

    # 原子写入
    temp_path = metadata_path.with_suffix('.tmp')
    with open(temp_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)
    temp_path.replace(metadata_path)

    return folder_id


def rebuild_mtime_index():
    """重建 mtime.json 索引"""
    mtime_data = {}

    for asset_dir in LIBRARY_ROOT.glob('images/K*.info'):
        meta_path = asset_dir / 'metadata.json'
        if meta_path.exists():
            asset_id = asset_dir.name.replace('.info', '')
            stat = meta_path.stat()
            mtime_data[asset_id] = int(stat.st_mtime * 1000)

    mtime_path = LIBRARY_ROOT / 'mtime.json'
    temp = mtime_path.with_suffix('.tmp')
    temp.write_text(json.dumps(mtime_data, ensure_ascii=False))
    temp.replace(mtime_path)

    print(f"  重建索引: {len(mtime_data)} 个资源")


def download_image(url: str, dest_path: Path, headers: dict = None, max_retries: int = 3) -> int:
    """
    下载图片，带重试机制

    Returns:
        下载的文件大小（字节）
    """
    default_headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
    }
    if headers:
        default_headers.update(headers)

    for attempt in range(max_retries):
        try:
            response = requests.get(url, headers=default_headers, timeout=60)
            response.raise_for_status()
            dest_path.write_bytes(response.content)
            return len(response.content)
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            import time
            time.sleep(1)
