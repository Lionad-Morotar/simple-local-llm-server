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

  // 智能合并行：将非空行合并（除非遇到明确的段落分隔）
  text = smartMergeLines(text);

  // 移除开头和结尾的空行
  text = text.trim();

  return text;
}

/**
 * 智能合并行：将被错误拆分的行合并在一起
 * 保留明确的段落分隔（空行），但合并同一段落内的行
 */
function smartMergeLines(text: string): string {
  const lines = text.split("\n");
  const result: string[] = [];
  let currentParagraph: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 过滤页码（纯数字行，通常是页码）
    if (/^\d+$/.test(line) && line.length <= 4) {
      continue;
    }

    // 空行处理：只有当前段落以句号等结束时才真正结束段落
    if (line === "") {
      const prevLine = currentParagraph[currentParagraph.length - 1];
      const prevEndsWithPunctuation = prevLine && /[。！？；]$/.test(prevLine);
      
      if (currentParagraph.length > 0 && prevEndsWithPunctuation) {
        // 句子完整，结束段落
        result.push(currentParagraph.join(""));
        currentParagraph = [];
      }
      // 如果句子未完成，忽略空行，继续累积
      continue;
    }

    // 检查是否是标题或特殊行（需要独立成行）
    const isTitle =
      /^[第\d一二三四五六七八九十百千万]+[章节]/.test(line) || // 章节标题
      /^[（(]?\d{4}\s*年/.test(line) || // 日期行
      /^目\s*录$/.test(line) || // 目录
      /^附\s*则$/.test(line); // 附则

    // 检查是否是条款开头（第X条）
    const isArticleStart = /^第[一二三四五六七八九十百千万\d]+条\s/.test(line);

    // 检查上一行是否以完整句子结束
    const prevLine = currentParagraph[currentParagraph.length - 1];
    const prevEndsWithPunctuation = prevLine && /[。！？；]$/.test(prevLine);

    if (isTitle) {
      // 标题独立成行
      if (currentParagraph.length > 0) {
        result.push(currentParagraph.join(""));
        currentParagraph = [];
      }
      result.push(line);
    } else if (isArticleStart && (currentParagraph.length === 0 || prevEndsWithPunctuation)) {
      // 条款开头，如果前面有内容且结束了，就新起一段
      if (currentParagraph.length > 0) {
        result.push(currentParagraph.join(""));
        currentParagraph = [];
      }
      currentParagraph.push(line);
    } else {
      // 普通行，累积到当前段落
      currentParagraph.push(line);
    }
  }

  // 处理最后一个段落
  if (currentParagraph.length > 0) {
    result.push(currentParagraph.join(""));
  }

  // 用双换行连接段落
  return result.join("\n\n");
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
