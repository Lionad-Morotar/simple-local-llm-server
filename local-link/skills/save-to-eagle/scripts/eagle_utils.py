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

    如果同名文件夹已存在，则返回现有文件夹的 ID

    Returns:
        文件夹的 ID
    """
    metadata_path = LIBRARY_ROOT / "metadata.json"

    with open(metadata_path, 'r', encoding='utf-8') as f:
        metadata = json.load(f)

    # 递归查找父文件夹，并检查是否已存在同名子文件夹
    def find_parent_and_check_duplicate(folder_list):
        for folder in folder_list:
            if folder["id"] == parent_id:
                # 检查是否已存在同名子文件夹
                for child in folder.get("children", []):
                    if child.get("name") == name:
                        return folder, child["id"]  # 返回父文件夹和现有子文件夹 ID
                return folder, None  # 返回父文件夹，无重复
            if folder.get("children"):
                result = find_parent_and_check_duplicate(folder["children"])
                if result[0] is not None:
                    return result
        return None, None

    parent_folder, existing_id = find_parent_and_check_duplicate(metadata.get("folders", []))

    if parent_folder is None:
        raise ValueError(f"父文件夹 {parent_id} 未找到")

    # 如果已存在同名文件夹，返回现有 ID
    if existing_id:
        print(f"   使用现有文件夹: {name}")
        return existing_id

    # 创建新文件夹
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

    parent_folder.setdefault("children", []).append(new_folder)

    # 原子写入
    temp_path = metadata_path.with_suffix('.tmp')
    with open(temp_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)
    temp_path.replace(metadata_path)

    return folder_id


def set_folder_cover(folder_id: str, asset_id: str):
    """
    设置文件夹封面

    Args:
        folder_id: 目标文件夹 ID
        asset_id: 作为封面的资源 ID
    """
    metadata_path = LIBRARY_ROOT / "metadata.json"

    with open(metadata_path, 'r', encoding='utf-8') as f:
        metadata = json.load(f)

    # 递归查找文件夹
    def find_and_update(folder_list):
        for folder in folder_list:
            if folder["id"] == folder_id:
                folder["coverId"] = asset_id
                return True
            if folder.get("children"):
                if find_and_update(folder["children"]):
                    return True
        return False

    if not find_and_update(metadata.get("folders", [])):
        raise ValueError(f"文件夹 {folder_id} 未找到")

    # 原子写入
    temp_path = metadata_path.with_suffix('.tmp')
    with open(temp_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)
    temp_path.replace(metadata_path)

    print(f"   设置封面: {asset_id}")


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


async def load_page_with_fallback(
    page,
    url: str,
    timeout: int = 60000,
    wait_strategies: list = None,
    extra_wait: float = 2.0
) -> str:
    """
    泛化的页面加载函数，支持自动降级策略

    当高优先级的加载策略（如 networkidle）超时时，自动降级到更低级的策略
    （如 domcontentloaded），确保页面能够成功加载。

    Args:
        page: Playwright 页面对象
        url: 要加载的 URL
        timeout: 每个策略的超时时间（毫秒）
        wait_strategies: 加载策略列表，按优先级排序。
                        默认为 ["networkidle", "load", "domcontentloaded"]
        extra_wait: 加载成功后额外等待的时间（秒），用于动态内容渲染

    Returns:
        实际使用的加载策略名称

    Raises:
        TimeoutError: 所有策略都失败时抛出

    Example:
        >>> strategy = await load_page_with_fallback(page, url, extra_wait=3.0)
        >>> print(f"使用策略: {strategy}")
    """
    if wait_strategies is None:
        # 默认策略：从高到低优先级
        wait_strategies = ["networkidle", "load", "domcontentloaded"]

    last_error = None

    for strategy in wait_strategies:
        try:
            await page.goto(url, wait_until=strategy, timeout=timeout)
            # 额外等待，确保动态内容加载
            if extra_wait > 0:
                import asyncio
                await asyncio.sleep(extra_wait)
            return strategy
        except Exception as e:
            last_error = e
            print(f"   策略 '{strategy}' 失败，尝试降级...")
            continue

    # 所有策略都失败
    raise TimeoutError(
        f"所有加载策略都失败 ({', '.join(wait_strategies)})。"
        f"最后错误: {last_error}"
    )


async def extract_with_playwright(
    url: str,
    extract_fn: callable,
    wait_strategies: list = None,
    timeout: int = 60000,
    extra_wait: float = 2.0,
    headless: bool = True
) -> dict:
    """
    泛化的 Playwright 数据提取函数

    封装了页面加载、数据提取和浏览器清理的完整流程，
    处理常见的超时和加载问题。

    Args:
        url: 要访问的 URL
        extract_fn: 在页面上执行的提取函数，接收 page 对象返回数据
        wait_strategies: 页面加载策略列表
        timeout: 加载超时时间（毫秒）
        extra_wait: 加载后额外等待时间（秒）
        headless: 是否使用无头模式

    Returns:
        extract_fn 返回的数据

    Example:
        >>> def extract_images(page):
        ...     return page.evaluate("() => document.images.length")
        >>> result = await extract_with_playwright(url, extract_images)
    """
    from playwright.async_api import async_playwright

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless)
        page = await browser.new_page()

        try:
            # 使用降级策略加载页面
            strategy = await load_page_with_fallback(
                page, url,
                timeout=timeout,
                wait_strategies=wait_strategies,
                extra_wait=extra_wait
            )
            print(f"   页面加载成功 (策略: {strategy})")

            # 执行提取函数
            result = await extract_fn(page)
            return result

        finally:
            await browser.close()
