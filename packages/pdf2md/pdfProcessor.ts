import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
// @ts-ignore
import { PDFParse } from "pdf-parse";
import { OCRProcessor } from "./ocrProcessor";

export interface ProcessResult {
  success: boolean;
  isEncrypted?: boolean;
  processedPath?: string;
  error?: Error;
  usedOCR?: boolean; // 是否使用了 OCR
}

export interface ProcessOptions {
  useOCR?: boolean; // 是否强制使用 OCR
  autoDetectOCR?: boolean; // 是否自动检测是否需要 OCR（默认 true）
  ocrLanguage?: string; // OCR 语言
}

/**
 * 检查 PDF 是否加密
 */
export async function checkPdfEncryption(pdfPath: string): Promise<boolean> {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    await PDFDocument.load(dataBuffer, {
      ignoreEncryption: false,
    });
    // 如果能正常加载，说明未加密或密码为空
    return false;
  } catch (error: any) {
    // 如果抛出加密相关错误，则说明 PDF 已加密
    if (
      error.message?.includes("encrypted") ||
      error.message?.includes("password")
    ) {
      return true;
    }
    // 其他错误重新抛出
    throw error;
  }
}

/**
 * 简单的页眉页脚检测算法
 * 基于文本在页面中的位置和重复性来判断
 */
function detectHeaderFooter(pages: any[]): {
  headerKeywords: string[];
  footerKeywords: string[];
} {
  const headerCandidates = new Map<string, number>();
  const footerCandidates = new Map<string, number>();

  // 分析前几页和后几页的顶部和底部文本
  const samplePages = Math.min(5, pages.length);

  for (let i = 0; i < samplePages; i++) {
    const pageItems = pages[i]?.items || [];
    if (pageItems.length === 0) continue;

    // 获取页面第一行（可能是页眉）
    const firstItem = pageItems[0];
    if (firstItem?.str) {
      const text = firstItem.str.trim();
      if (text.length > 0 && text.length < 100) {
        headerCandidates.set(text, (headerCandidates.get(text) || 0) + 1);
      }
    }

    // 获取页面最后一行（可能是页脚）
    const lastItem = pageItems[pageItems.length - 1];
    if (lastItem?.str) {
      const text = lastItem.str.trim();
      if (text.length > 0 && text.length < 100) {
        footerCandidates.set(text, (footerCandidates.get(text) || 0) + 1);
      }
    }
  }

  // 选择出现次数 >= 2 的文本作为页眉页脚关键词
  const headerKeywords = Array.from(headerCandidates.entries())
    .filter(([_, count]) => count >= 2)
    .map(([text, _]) => text);

  const footerKeywords = Array.from(footerCandidates.entries())
    .filter(([_, count]) => count >= 2)
    .map(([text, _]) => text);

  return { headerKeywords, footerKeywords };
}

/**
 * 移除页眉页脚文本
 */
function removeHeaderFooterFromText(
  text: string,
  headerKeywords: string[],
  footerKeywords: string[]
): string {
  let processed = text;

  // 移除页眉
  for (const keyword of headerKeywords) {
    const regex = new RegExp(
      keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "g"
    );
    processed = processed.replace(regex, "");
  }

  // 移除页脚（通常包含页码）
  for (const keyword of footerKeywords) {
    const regex = new RegExp(
      keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "g"
    );
    processed = processed.replace(regex, "");
  }

  // 移除常见页码模式
  processed = processed.replace(/^\s*\d+\s*$/gm, ""); // 单独一行的数字
  processed = processed.replace(/^Page\s+\d+\s*$/gim, ""); // "Page X" 格式
  processed = processed.replace(/^\s*-\s*\d+\s*-\s*$/gm, ""); // "- X -" 格式
  processed = processed.replace(/--\s*\d+\s+of\s+\d+\s*--/gim, ""); // "-- 1 of 73 --" 格式（可能在行中间）
  processed = processed.replace(/--\s*\d+\s*\/\s*\d+\s*--/gim, ""); // "-- 1/73 --" 格式

  return processed;
}

/**
 * 处理 PDF 文件
 * 1. 检查是否加密
 * 2. 提取文本（支持 OCR）
 * 3. 删除页眉页脚
 */
export async function processPdf(
  pdfPath: string,
  outputDir: string,
  options: ProcessOptions = {}
): Promise<ProcessResult> {
  const {
    useOCR = false,
    autoDetectOCR = true,
    ocrLanguage = "chi_sim+eng",
  } = options;

  try {
    // 1. 检查是否加密
    const isEncrypted = await checkPdfEncryption(pdfPath);
    if (isEncrypted) {
      return {
        success: false,
        isEncrypted: true,
      };
    }

    let processedText = "";
    let usedOCR = false;

    // 2. 判断是否需要使用 OCR
    let shouldUseOCR = useOCR;
    if (!shouldUseOCR && autoDetectOCR) {
      shouldUseOCR = await OCRProcessor.needsOCR(pdfPath);
    }

    if (shouldUseOCR) {
      // 2a. 使用 OCR 提取文本
      console.log(`🔍 使用 OCR 模式处理 PDF...`);
      const ocrProcessor = new OCRProcessor({
        language: ocrLanguage,
      });

      const ocrResult = await ocrProcessor.processPdf(pdfPath, outputDir);

      if (!ocrResult.success || !ocrResult.text) {
        throw ocrResult.error || new Error("OCR 处理失败");
      }

      processedText = ocrResult.text;
      usedOCR = true;
    } else {
      // 2b. 使用标准文本提取
      console.log(`📄 使用标准模式提取文本...`);
      const dataBuffer = fs.readFileSync(pdfPath);
      const parser = new PDFParse({ data: dataBuffer, verbosity: 0 });
      const pdfData = await parser.getText();
      processedText = pdfData.text;
    }

    // 3. 检测并移除页眉页脚
    const { headerKeywords, footerKeywords } = detectHeaderFooter(
      processedText ? [{ items: [{ str: processedText }] }] : []
    );

    if (headerKeywords.length > 0 || footerKeywords.length > 0) {
      processedText = removeHeaderFooterFromText(
        processedText,
        headerKeywords,
        footerKeywords
      );
    }

    // 4. 保存处理后的文本到临时文件
    const filename = path.basename(pdfPath, ".pdf");
    const processedPath = path.join(outputDir, `${filename}.txt`);

    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(processedPath, processedText, "utf-8");

    return {
      success: true,
      isEncrypted: false,
      processedPath,
      usedOCR,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
