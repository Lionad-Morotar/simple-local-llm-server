import fs from "fs";

export interface ProcessResult {
  success: boolean;
  text?: string;
  error?: Error;
}

/**
 * 将 Markdown 文本转换为纯文本
 */
function markdownToText(markdown: string): string {
  let text = markdown;

  // 移除 YAML Front Matter
  text = text.replace(/^---\n[\s\S]*?\n---\n/gm, "");

  // 移除 HTML 标签
  text = text.replace(/<[^>]*>/g, "");

  // 移除 Markdown 图片 ![alt](url)
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");

  // 移除 Markdown 链接，保留文本 [text](url)
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");

  // 移除代码块标记 ```
  text = text.replace(/```[\s\S]*?```/g, (match) => {
    // 保留代码内容，移除标记
    return match.replace(/```[^\n]*\n?/g, "").replace(/```/g, "");
  });

  // 移除行内代码标记 `code`
  text = text.replace(/`([^`]+)`/g, "$1");

  // 移除标题标记 #
  text = text.replace(/^#{1,6}\s+/gm, "");

  // 移除粗体标记 **text** 或 __text__
  text = text.replace(/(\*\*|__)(.*?)\1/g, "$2");

  // 移除斜体标记 *text* 或 _text_
  text = text.replace(/(\*|_)(.*?)\1/g, "$2");

  // 移除删除线 ~~text~~
  text = text.replace(/~~(.*?)~~/g, "$1");

  // 移除水平分割线
  text = text.replace(/^[-*_]{3,}\s*$/gm, "");

  // 移除列表标记（无序列表）
  text = text.replace(/^\s*[-*+]\s+/gm, "");

  // 移除列表标记（有序列表）
  text = text.replace(/^\s*\d+\.\s+/gm, "");

  // 移除引用标记 >
  text = text.replace(/^\s*>\s?/gm, "");

  // 移除 Markdown 表格（保留内容）
  text = text.replace(/^\|(.+)\|$/gm, (match) => {
    // 移除表格边框 | 符号，保留内容
    return match.replace(/^\||\|$/g, "").replace(/\|/g, " ");
  });

  // 移除表格分隔线（如 |---|---|---| ）
  text = text.replace(/^\|?[\s-:|]+\|?$/gm, "");

  // 移除多余的空行（超过2个连续换行）
  text = text.replace(/\n{3,}/g, "\n\n");

  // 移除行首行尾空格
  text = text
    .split("\n")
    .map((line) => line.trim())
    .join("\n");

  // 移除开头和结尾的空行
  text = text.trim();

  return text;
}

/**
 * 检测 Markdown 文件头尾是否有重复内容（类似 PDF 的页眉页脚）
 */
function detectHeaderFooter(text: string): { header: string[]; footer: string[] } {
  const lines = text.split("\n").filter((line) => line.trim());
  const totalLines = lines.length;

  if (totalLines < 10) {
    return { header: [], footer: [] };
  }

  // 检测重复的页眉（前 5 行）
  const headerCandidates = lines.slice(0, 5);
  const header = headerCandidates.filter((line) => {
    const occurrences = lines.filter((l) => l === line).length;
    return occurrences > 2; // 出现超过 2 次，可能是页眉
  });

  // 检测重复的页脚（后 5 行）
  const footerCandidates = lines.slice(-5);
  const footer = footerCandidates.filter((line) => {
    const occurrences = lines.filter((l) => l === line).length;
    return occurrences > 2; // 出现超过 2 次，可能是页脚
  });

  return { header, footer };
}

/**
 * 移除文本中的页眉页脚
 */
function removeHeaderFooterFromText(
  text: string,
  header: string[],
  footer: string[]
): string {
  let lines = text.split("\n");

  // 移除页眉
  if (header.length > 0) {
    lines = lines.filter((line) => !header.includes(line.trim()));
  }

  // 移除页脚
  if (footer.length > 0) {
    lines = lines.filter((line) => !footer.includes(line.trim()));
  }

  return lines.join("\n");
}

/**
 * 处理单个 Markdown 文件
 */
export async function processMd(
  mdPath: string,
  outputPath: string
): Promise<ProcessResult> {
  try {
    // 读取 Markdown 文件
    const markdown = fs.readFileSync(mdPath, "utf-8");

    // 转换为纯文本
    let text = markdownToText(markdown);

    // 检测并移除页眉页脚
    const { header, footer } = detectHeaderFooter(text);
    if (header.length > 0 || footer.length > 0) {
      console.log(
        `  🔍 检测到重复内容 - 页眉: ${header.length} 条, 页脚: ${footer.length} 条`
      );
      text = removeHeaderFooterFromText(text, header, footer);
    }

    // 保存为临时文本文件（等待 worker 进一步处理）
    fs.writeFileSync(outputPath, text, "utf-8");

    return {
      success: true,
      text,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
