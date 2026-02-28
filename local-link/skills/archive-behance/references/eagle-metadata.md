# Eagle Metadata Format Reference

Eagle uses a JSON-based file system structure for storing asset metadata.

## Directory Structure

```
{library_root}/
├── metadata.json          # Central folder structure
├── tags.json              # Tag dictionary
├── mtime.json             # Modification time index
├── images/                # Asset storage
│   └── {ASSET_ID}.info/   # Individual asset directory
│       ├── {filename}     # Original file
│       └── metadata.json  # Asset metadata
```

## Asset ID Format

Eagle uses Base62-style IDs with format: `{PREFIX}{TIMESTAMP}{RANDOM}`
- Example: `KMTBCYBCPDMGK`
- Length: 11-14 characters
- Prefix: Usually `K` for assets

## Asset Metadata File

Location: `images/{ID}.info/metadata.json`

```json
{
  "id": "KMTBCYBCPDMGK",
  "name": "Asset Name",
  "size": 1055772,
  "btime": 1623227349186,
  "mtime": 1616945092000,
  "ext": "png",
  "tags": ["tag1", "tag2"],
  "folders": ["FOLDER_ID_1", "FOLDER_ID_2"],
  "isDeleted": false,
  "url": "https://source.website.com/image.png",
 "annotation": "",
  "width": 565,
  "height": 900,
  "palettes": [
    {"color": [78, 58, 61], "ratio": 44}
  ],
  "star": 0,
  "rating": 0
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique asset identifier |
| `name` | string | Display name |
| `size` | number | File size in bytes |
| `btime` | number | Birth time (creation) - Unix timestamp in ms |
| `mtime` | number | Modification time - Unix timestamp in ms |
| `ext` | string | File extension without dot |
| `tags` | string[] | Array of tag names |
| `folders` | string[] | Array of folder IDs containing this asset |
| `isDeleted` | boolean | Soft delete flag |
| `url` | string | Source URL (optional) |
| `annotation` | string | User notes (optional) |
| `width` | number | Image width in pixels |
| `height` | number | Image height in pixels |
| `palettes` | array | Dominant colors with ratios |
| `star` | number | Star rating (0-5) |
| `rating` | number | Numeric rating |

### Color Palette Format

```json
{
  "color": [R, G, B],
  "ratio": percentage
}
```

Example: `{"color": [78, 58, 61], "ratio": 44}` means this color covers 44% of the image.

## Central Metadata File

Location: `metadata.json`

Contains the folder hierarchy and asset-to-folder mappings.

```json
{
  "folders": [
    {
      "id": "LXGBKMB5GF4FI",
      "name": "Folder Name",
      "description": "",
      "children": [
        {
          "id": "CHILD_FOLDER_ID",
          "name": "Subfolder",
          "description": "",
          "children": [],
          "modificationTime": 1741562828165,
          "tags": [],
          "password": "",
          "passwordTips": ""
        }
      ],
      "modificationTime": 1741562828165,
      "tags": [],
      "password": "",
      "passwordTips": ""
    }
  ],
  "smartFolders": [],
  "quickAccess": [],
  "tagsGroups": []
}
```

### Folder Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique folder identifier |
| `name` | string | Display name |
| `description` | string | Folder description |
| `children` | array | Nested folders |
| `modificationTime` | number | Last modified timestamp |
| `tags` | string[] | Auto-apply tags |
| `password` | string | Protection password (plaintext) |
| `passwordTips` | string | Password hint |

## Creating New Assets

### Step 1: Generate Asset ID

```python
import time
import random
import string

def generate_asset_id():
    timestamp = int(time.time() * 1000)
    random_chars = ''.join(random.choices(
        string.ascii_uppercase + string.ascii_lowercase + string.digits,
        k=10
    ))
    return f"K{timestamp}{random_chars}"
```

### Step 2: Create Directory Structure

```python
from pathlib import Path

def create_asset_dir(library_root: Path, asset_id: str):
    asset_dir = library_root / "images" / f"{asset_id}.info"
    asset_dir.mkdir(parents=True, exist_ok=True)
    return asset_dir
```

### Step 3: Download and Save Image

```python
import requests

def download_image(url: str, dest_path: Path):
    response = requests.get(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    })
    response.raise_for_status()
    dest_path.write_bytes(response.content)
    return len(response.content)
```

### Step 4: Create Metadata

```python
import json
from PIL import Image

def create_asset_metadata(
    asset_id: str,
    name: str,
    file_path: Path,
    url: str,
    folder_ids: list[str],
    tags: list[str] = None
):
    # Get image dimensions
    with Image.open(file_path) as img:
        width, height = img.size

    # Get file stats
    stat = file_path.stat()

    metadata = {
        "id": asset_id,
        "name": name,
        "size": stat.st_size,
        "btime": int(stat.st_birthtime * 1000),
        "mtime": int(stat.st_mtime * 1000),
        "ext": file_path.suffix.lstrip('.'),
        "tags": tags or [],
        "folders": folder_ids,
        "isDeleted": False,
        "url": url,
        "annotation": "",
        "width": width,
        "height": height,
        "palettes": [],
        "star": 0,
        "rating": 0
    }

    # Save metadata
    metadata_path = file_path.parent / "metadata.json"
    metadata_path.write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2)
    )

    return metadata
```

### Step 5: Update Central Metadata

After creating asset directories, update `metadata.json` to register new folders.

```python
def add_folder_to_metadata(
    library_root: Path,
    parent_folder_id: str,
    new_folder: dict
):
    metadata_path = library_root / "metadata.json"
    metadata = json.loads(metadata_path.read_text())

    def find_and_add(folder_list, parent_id, new_child):
        for folder in folder_list:
            if folder["id"] == parent_id:
                folder["children"].append(new_child)
                folder["modificationTime"] = int(time.time() * 1000)
                return True
            if find_and_add(folder.get("children", []), parent_id, new_child):
                return True
        return False

    # Find parent and add new folder
    find_and_add(metadata["folders"], parent_folder_id, new_folder)

    # Save updated metadata
    metadata_path.write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2)
    )
```

## Important Notes

1. **Timestamps**: Eagle uses milliseconds (JavaScript Date.getTime() format)
2. **File Extensions**: Store without leading dot (e.g., "jpg" not ".jpg")
3. **Folder IDs**: Assets reference folders by ID, not by path
4. **Atomic Writes**: Write to temp file then rename to avoid corruption
5. **Backup**: Always backup metadata.json before modifications

## Time Conversion

```python
# Python datetime to Eagle timestamp
import datetime
def to_eagle_time(dt: datetime.datetime) -> int:
    return int(dt.timestamp() * 1000)

# Eagle timestamp to Python datetime
def from_eagle_time(timestamp: int) -> datetime.datetime:
    return datetime.datetime.fromtimestamp(timestamp / 1000)
```
