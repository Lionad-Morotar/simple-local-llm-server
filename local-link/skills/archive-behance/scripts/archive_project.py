#!/usr/bin/env python3
"""
归档 Behance 项目到 Eagle 素材库的完整示例脚本
包含所有必需步骤和验证
"""
import json
import random
import string
import shutil
import requests
from pathlib import Path
from datetime import datetime
from PIL import Image


def generate_eagle_id() -> str:
    """生成正确的 Eagle ID 格式 (13字符: K + 12位字母数字)"""
    chars = string.ascii_uppercase + string.ascii_lowercase + string.digits
    return 'K' + ''.join(random.choices(chars, k=12))


def create_thumbnail(img_path: Path, thumb_path: Path, size=(240, 240)):
    """创建 Eagle 缩略图"""
    with Image.open(img_path) as img:
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        img.thumbnail(size, Image.Resampling.LANCZOS)
        background = Image.new('RGB', size, (255, 255, 255))
        offset = ((size[0] - img.width) // 2, (size[1] - img.height) // 2)
        background.paste(img, offset)
        background.save(thumb_path, 'PNG')


def get_exif_orientation(img) -> int:
    """获取 EXIF 方向信息"""
    try:
        exif = img._getexif()
        if exif and 274 in exif:
            return exif[274]
    except:
        pass
    return 1


def download_image(url: str, dest_path: Path, max_retries: int = 3) -> int:
    """下载图片，带重试机制"""
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Referer": "https://www.behance.net/"
    }

    for attempt in range(max_retries):
        try:
            response = requests.get(url, headers=headers, timeout=60)
            response.raise_for_status()
            dest_path.write_bytes(response.content)
            return len(response.content)
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            import time
            time.sleep(1)


def create_eagle_asset(library_root: Path, image_url: str, name: str,
                       folder_id: str, tags: list = None) -> dict:
    """创建完整的 Eagle 资源"""

    # 1. 生成正确的 13-char ID
    asset_id = generate_eagle_id()
    asset_dir = library_root / "images" / f"{asset_id}.info"
    asset_dir.mkdir(parents=True, exist_ok=True)

    # 2. 下载图片
    ext = image_url.split('.')[-1].split('?')[0]
    if ext not in ['jpg', 'jpeg', 'png', 'webp', 'gif']:
        ext = 'jpg'

    # CRITICAL: Filename must match metadata "name" field!
    img_path = asset_dir / f"{name}.{ext}"
    download_image(image_url, img_path)

    # 3. 生成缩略图 (必需!)
    thumb_path = asset_dir / f"{name}_thumbnail.png"
    create_thumbnail(img_path, thumb_path)

    # 4. 获取图片信息
    with Image.open(img_path) as img:
        width, height = img.size
        orientation = get_exif_orientation(img)

    stat = img_path.stat()
    now_ms = int(datetime.now().timestamp() * 1000)

    # 5. 创建完整元数据
    metadata = {
        "id": asset_id,
        "name": name,
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
        "url": image_url,
        "annotation": "",
        "palettes": []
    }

    # 6. 保存元数据
    meta_path = asset_dir / "metadata.json"
    meta_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2))

    return metadata


def rebuild_mtime_index(library_root: Path):
    """重建 mtime.json 索引"""
    mtime_data = {}

    for asset_dir in library_root.glob('images/K*.info'):
        meta_path = asset_dir / 'metadata.json'
        if meta_path.exists():
            asset_id = asset_dir.name.replace('.info', '')
            stat = meta_path.stat()
            mtime_data[asset_id] = int(stat.st_mtime * 1000)

    mtime_path = library_root / 'mtime.json'
    temp = mtime_path.with_suffix('.tmp')
    temp.write_text(json.dumps(mtime_data, ensure_ascii=False))
    temp.replace(mtime_path)

    print(f"  重建索引: {len(mtime_data)} 个资源")


def verify_asset_integrity(asset_dir: Path) -> dict:
    """验证资源完整性"""
    result = {'valid': True, 'errors': [], 'warnings': []}

    meta_path = asset_dir / 'metadata.json'
    if not meta_path.exists():
        result['valid'] = False
        result['errors'].append('缺少 metadata.json')
        return result

    try:
        meta = json.loads(meta_path.read_text())
    except json.JSONDecodeError:
        result['valid'] = False
        result['errors'].append('metadata.json 格式错误')
        return result

    # 验证必需字段
    required = ['id', 'name', 'size', 'btime', 'mtime', 'ext',
                'width', 'height', 'orientation', 'modificationTime',
                'lastModified', 'folders', 'isDeleted']

    for field in required:
        if field not in meta:
            result['errors'].append(f'缺少字段: {field}')

    # 验证 ID 格式
    asset_id = meta.get('id', '')
    if len(asset_id) != 13:
        result['errors'].append(f'ID 长度错误: {len(asset_id)} != 13')

    # 验证图片文件
    ext = meta.get('ext', 'jpg')
    img_path = asset_dir / f'{asset_id}.{ext}'
    if not img_path.exists():
        result['errors'].append(f'缺少图片文件')

    # 验证缩略图
    thumbs = list(asset_dir.glob('*_thumbnail.png'))
    if not thumbs:
        result['errors'].append('缺少缩略图')

    result['valid'] = len(result['errors']) == 0
    return result


def main():
    """示例: 归档 Behance 项目"""

    library_root = Path("/path/to/your/eagle/library")
    folder_id = "YOUR_FOLDER_ID"  # 例如: 7UAPMLRGTWT (插图)

    # 示例图片列表
    images = [
        {
            "src": "https://mir-s3-cdn-cf.behance.net/project_modules/1400/xxx.jpg",
            "alt": "Image Name"
        },
    ]

    print(f"开始归档 {len(images)} 张图片...")

    # 创建资源
    for i, img_info in enumerate(images, 1):
        try:
            name = img_info.get('alt') or f"Image-{i}"
            create_eagle_asset(
                library_root=library_root,
                image_url=img_info['src'],
                name=name,
                folder_id=folder_id,
                tags=[]
            )
            print(f"  ✓ {name}")
        except Exception as e:
            print(f"  ✗ 错误: {e}")

    # 重建索引 (关键步骤!)
    rebuild_mtime_index(library_root)

    print("归档完成! 请重启 Eagle 查看")


if __name__ == "__main__":
    main()
