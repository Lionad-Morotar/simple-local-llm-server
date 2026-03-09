#!/usr/bin/env python3
"""
从 Edge 浏览器获取无障碍树并解析为精简的 role tree
使用方法: python3 get_role_tree.py [page_url_substring]
"""
import asyncio
import os
import sys

# 隐藏 Node.js 弃用警告
os.environ['NODE_NO_WARNINGS'] = '1'

from playwright.async_api import async_playwright

CDP_URL = "http://localhost:9222"

# 角色映射：简化为短标签
ROLE_MAP = {
    'RootWebArea': 'root',
    'main': 'main',
    'article': 'article',
    'section': 'section',
    'navigation': 'nav',
    'complementary': 'aside',
    'banner': 'header',
    'contentinfo': 'footer',
    'search': 'search',
    'form': 'form',
    'heading': 'h2',
    'button': 'btn',
    'link': 'a',
    'textbox': 'input',
    'checkbox': 'checkbox',
    'radio': 'radio',
    'listbox': 'select',
    'combobox': 'select',
    'tab': 'tab',
    'tabpanel': 'tabpanel',
    'dialog': 'dialog',
    'alert': 'alert',
    'list': 'ul',
    'listitem': 'li',
    'table': 'table',
    'grid': 'grid',
    'cell': 'td',
    'row': 'tr',
    'img': 'img',
    'figure': 'figure',
    'paragraph': 'p',
    'code': 'code',
    'DescriptionList': 'dl',
}

# 完全忽略的角色（不创建节点，只透传子节点）
DROP_ROLES = {'none', 'presentation', 'separator', 'generic', 'sectionheader',
              'ListMarker', 'strong', 'StaticText', 'InlineTextBox'}

# 容器类角色：使用自己的 name，忽略子节点的文本透传
CONTAINER_ROLES = {'paragraph', 'code'}

# 描述列表相关角色（需要特殊处理为键值对）
DL_ROLES = {'term', 'definition'}

# 有 name 就足够的角色（不需要子节点）
NAME_ONLY_ROLES = {'link', 'button', 'heading', 'textbox'}


def simplify_node(node, node_map):
    """简化节点为精简格式"""
    role = node.get('role', {}).get('value', '')
    name = node.get('name', {}).get('value', '')
    value = node.get('value', {}).get('value', '')

    # 递归处理子节点
    child_ids = node.get('childIds', [])
    children = []

    for child_id in child_ids:
        child = node_map.get(child_id)
        if not child:
            continue
        result = simplify_node(child, node_map)
        if result is not None:
            if isinstance(result, list):
                children.extend(result)
            else:
                children.append(result)

    # 如果角色被丢弃，直接返回子节点列表（透传）
    if role in DROP_ROLES:
        content = name or value
        if content:
            # 检查子节点是否都是纯文本且内容被当前节点包含（避免重复）
            if children and all(isinstance(c, str) for c in children):
                combined = ''.join(children)
                # 如果当前内容包含所有子节点内容，直接返回当前内容
                if content.replace('\n', ' ').replace('  ', ' ').strip() == combined.replace('\n', ' ').replace('  ', ' ').strip() or content.strip() in combined.strip():
                    return content
                # 如果子节点内容被当前内容包含，直接返回当前内容
                if combined.strip() in content.strip():
                    return content
            if children and len(children) > 0:
                first = children[0]
                if isinstance(first, str) and first.strip() == content.strip():
                    return children
            return [content] + children if children else content
        return children if children else None

    # 容器类角色：使用自己的 name，忽略子节点的文本透传（避免重复）
    if role in CONTAINER_ROLES and name:
        return {ROLE_MAP.get(role, role): name}

    # 描述列表的 term/definition 处理为键值对
    # term 使用 name 作为键，definition 使用 name 或子节点作为值
    if role == 'term':
        content = name or value
        return {'term': content} if content else None

    if role == 'definition':
        content = name or value
        if children:
            return {'definition': children if len(children) > 1 else children[0]}
        return {'definition': content} if content else None

    # 映射角色
    mapped_role = ROLE_MAP.get(role, role)

    # heading 角色需要处理 level 属性（在 properties 数组中）
    if role == 'heading':
        level = 2  # 默认 h2
        for prop in node.get('properties', []):
            if prop.get('name') == 'level':
                level = prop.get('value', {}).get('value', 2)
                break
        mapped_role = f"h{level}"

    # 对于有 name 就足够了的角色，优先使用 name，忽略子节点
    if role in NAME_ONLY_ROLES and name:
        return {mapped_role: name}

    # 构建节点
    content = name or value

    if children:
        if content:
            return {mapped_role: [content] + children}
        return {mapped_role: children if len(children) > 1 else children[0]}
    elif content:
        return {mapped_role: content}
    else:
        return {mapped_role: None}


def count_nodes(obj):
    """统计节点数量"""
    if isinstance(obj, str):
        return 1
    if isinstance(obj, dict):
        count = 1
        for v in obj.values():
            if isinstance(v, list):
                count += sum(count_nodes(i) for i in v)
            else:
                count += count_nodes(v)
        return count
    if isinstance(obj, list):
        return sum(count_nodes(i) for i in obj)
    return 0


def compact_inline(items):
    """将列表紧凑地内联为字符串表示"""
    parts = []
    for item in items:
        if isinstance(item, str):
            parts.append(item)
        elif isinstance(item, dict):
            # 简化为 key(value) 格式
            for k, v in item.items():
                if isinstance(v, str):
                    parts.append(f"{k}({v})")
                elif isinstance(v, list):
                    inner = compact_inline(v)
                    parts.append(f"{k}[{inner}]")
                else:
                    parts.append(k)
                break
    return ' '.join(parts)


def to_yaml(obj, indent=0, parent_key=None):
    """转换为纯缩进格式字符串（无列表标记）"""
    prefix = "  " * indent

    if isinstance(obj, str):
        if ':' in obj or obj.startswith('"') or '\n' in obj or obj.startswith(' '):
            escaped = obj.replace('"', '\\"').replace('\n', ' ')
            return f'"{escaped}"'
        return obj

    if isinstance(obj, list):
        lines = []
        i = 0
        while i < len(obj):
            item = obj[i]
            if isinstance(item, str):
                # 字符串列表项作为 key: value 形式，key 用索引或占位符
                lines.append(f"{prefix}{item}")
            elif isinstance(item, dict):
                # 检查是否是 term/definition 对
                if 'term' in item and i + 1 < len(obj):
                    next_item = obj[i + 1]
                    if isinstance(next_item, dict) and 'definition' in next_item:
                        term_val = item['term']
                        def_val = next_item['definition']

                        if isinstance(def_val, str):
                            lines.append(f"{prefix}{term_val}: {to_yaml(def_val, indent)}")
                        elif isinstance(def_val, list):
                            inline_val = compact_inline(def_val)
                            if len(inline_val) < 80:
                                lines.append(f"{prefix}{term_val}: {inline_val}")
                            else:
                                lines.append(f"{prefix}{term_val}:")
                                yaml_v = to_yaml(def_val, indent + 1)
                                if yaml_v:
                                    lines.append(yaml_v)
                        else:
                            lines.append(f"{prefix}{term_val}:")
                            yaml_v = to_yaml(def_val, indent + 1)
                            if yaml_v:
                                lines.append(yaml_v)
                        i += 2
                        continue

                # 普通字典处理
                for k, v in item.items():
                    if k in ('term', 'definition'):
                        if isinstance(v, str):
                            lines.append(f"{prefix}{v}")
                        else:
                            yaml_v = to_yaml(v, indent + 1)
                            if yaml_v:
                                lines.append(yaml_v)
                    elif isinstance(v, str):
                        lines.append(f"{prefix}{k}: {to_yaml(v, indent)}")
                    elif isinstance(v, list):
                        inline_val = compact_inline(v)
                        if len(inline_val) < 120 and '\n' not in inline_val:
                            lines.append(f"{prefix}{k}: {inline_val}")
                        else:
                            lines.append(f"{prefix}{k}:")
                            yaml_v = to_yaml(v, indent + 1)
                            if yaml_v:
                                lines.append(yaml_v)
                    else:
                        lines.append(f"{prefix}{k}:")
                        yaml_v = to_yaml(v, indent + 1)
                        if yaml_v:
                            lines.append(yaml_v)
                    break
            else:
                yaml_item = to_yaml(item, indent + 1)
                if yaml_item:
                    lines.append(f"{prefix}{yaml_item}")
            i += 1
        return "\n".join(lines) if lines else ""

    if isinstance(obj, dict):
        lines = []
        for k, v in obj.items():
            if v is None:
                lines.append(f"{prefix}{k}:")
            elif isinstance(v, str):
                lines.append(f"{prefix}{k}: {to_yaml(v, indent)}")
            elif isinstance(v, list):
                # 检查列表是否可以内联
                inline_val = compact_inline(v)
                if len(inline_val) < 120 and '\n' not in inline_val:
                    lines.append(f"{prefix}{k}: {inline_val}")
                else:
                    lines.append(f"{prefix}{k}:")
                    yaml_v = to_yaml(v, indent + 1)
                    if yaml_v:
                        lines.append(yaml_v)
            elif isinstance(v, dict):
                lines.append(f"{prefix}{k}:")
                lines.append(to_yaml(v, indent + 1))
        return "\n".join(lines)

    return f"{prefix}{obj}"


async def main():
    url_filter = sys.argv[1] if len(sys.argv) > 1 else None

    try:
        async with async_playwright() as p:
            browser = await p.chromium.connect_over_cdp(CDP_URL)
            context = browser.contexts[0]
            pages = context.pages

            target_page = None
            if url_filter:
                target_page = next((p for p in pages if url_filter in p.url), None)
            else:
                target_page = pages[0] if pages else None

            if not target_page:
                print(f"❌ 未找到匹配的页面: {url_filter or '(any)'}", file=sys.stderr)
                print("   可用页面:", file=sys.stderr)
                for page in pages:
                    print(f"   - {page.url[:70]}...", file=sys.stderr)
                await browser.close()
                sys.exit(1)

            print(f"# {target_page.url}\n")

            # 获取无障碍树
            client = await context.new_cdp_session(target_page)
            await client.send("Accessibility.enable")
            result = await client.send("Accessibility.getFullAXTree")
            await client.send("Accessibility.disable")
            await browser.close()

            nodes = result.get("nodes", [])
            node_map = {n["nodeId"]: n for n in nodes}
            root_node = next((n for n in nodes if n.get("role", {}).get("value") == "RootWebArea"), None)

            if not root_node:
                print("❌ 未找到根节点")
                sys.exit(1)

            simplified_tree = simplify_node(root_node, node_map)
            meaningful_count = count_nodes(simplified_tree) if simplified_tree else 0

            print(f"# Role Tree: {meaningful_count} 个节点 (原始 {len(nodes)} 个)\n")
            if simplified_tree:
                print(to_yaml(simplified_tree))

    except Exception as e:
        print(f"❌ 错误: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
