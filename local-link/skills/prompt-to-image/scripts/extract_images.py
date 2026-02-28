#!/usr/bin/env python3
"""
Process API response and extract images from Gemini generateContent response.
"""

import json
import base64
import sys
from pathlib import Path
from datetime import datetime


def extract_images_from_response(response_json_path: str, output_dir: str) -> list[str]:
    """
    Extract images from Gemini API response and save to files.

    Args:
        response_json_path: Path to the response JSON file
        output_dir: Directory to save extracted images

    Returns:
        List of paths to extracted image files
    """
    with open(response_json_path, 'r') as f:
        data = json.load(f)

    extracted_paths = []

    # Create output directory
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # Extract images from candidates
    if 'candidates' in data:
        for candidate_idx, candidate in enumerate(data['candidates']):
            if 'content' in candidate and 'parts' in candidate['content']:
                for part_idx, part in enumerate(candidate['content']['parts']):
                    if 'inlineData' in part:
                        inline_data = part['inlineData']
                        mime_type = inline_data.get('mimeType', 'image/jpeg')
                        base64_data = inline_data.get('data', '')

                        # Determine file extension
                        ext_map = {
                            'image/jpeg': '.jpg',
                            'image/png': '.png',
                            'image/gif': '.gif',
                            'image/webp': '.webp'
                        }
                        ext = ext_map.get(mime_type, '.jpg')

                        # Generate filename
                        timestamp = datetime.now().strftime('%H-%M-%S')
                        base_name = f"image_{timestamp}"
                        image_path = output_path / f"{base_name}{ext}"

                        # Handle duplicates
                        counter = 1
                        while image_path.exists():
                            image_path = output_path / f"{base_name}_{counter}{ext}"
                            counter += 1

                        # Decode and save image
                        image_data = base64.b64decode(base64_data)
                        with open(image_path, 'wb') as img_file:
                            img_file.write(image_data)

                        extracted_paths.append(str(image_path))
                        print(f"Extracted: {image_path}")

    return extracted_paths


def main():
    if len(sys.argv) < 3:
        print("Usage: python extract_images.py <response.json> <output_dir>")
        sys.exit(1)

    response_path = sys.argv[1]
    output_dir = sys.argv[2]

    paths = extract_images_from_response(response_path, output_dir)

    if paths:
        print(f"\n✅ Extracted {len(paths)} image(s)")
        for path in paths:
            print(f"  - {path}")
    else:
        print("\n⚠️  No images found in response")


if __name__ == '__main__':
    main()
