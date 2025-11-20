import fs from "fs";
import path from "path";
import { createWorker, Worker as TesseractWorker } from "tesseract.js";
import { fromPath } from "pdf2pic";

export interface OCROptions {
  language?: string; // OCR 语言，默认 "chi_sim+eng"（简体中文+英文）
  dpi?: number; // 图片 DPI，默认 300
  saveImages?: boolean; // 是否保存中间图片
  imageOutputDir?: string; // 图片输出目录
}

export interface OCRResult {
  success: boolean;
  text?: string;
  error?: Error;
  processedPages?: number;
}

/**
 * OCR 处理器类
 */
export class OCRProcessor {
  private worker: TesseractWorker | null = null;
  private options: Required<OCROptions>;

  constructor(options: OCROptions = {}) {
    this.options = {
      language: options.language || "chi_sim+eng",
      dpi: options.dpi || 300,
      saveImages: options.saveImages || false,
      imageOutputDir: options.imageOutputDir || "",
    };
  }

  /**
   * 初始化 Tesseract Worker
   */
  async initialize(): Promise<void> {
    if (this.worker) return;

    console.log(`🔧 初始化 OCR 引擎 (语言: ${this.options.language})...`);
    
    try {
      // 创建缓存目录
      const cacheDir = path.join(process.cwd(), '.cache', 'tesseract');
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      // 使用 createWorker，配置正确的选项
      this.worker = await createWorker(this.options.language, 1, {
        logger: (m) => {
          // 显示下载和初始化进度
          if (m.status === 'loading tesseract core' || m.status === 'initializing tesseract' || m.status === 'loading language traineddata') {
            process.stdout.write(`\r📦 ${m.status}... ${Math.round((m.progress || 0) * 100)}%`);
          } else if (m.status === "recognizing text") {
            // 只在识别文本时显示进度
            const progress = Math.round(m.progress * 100);
            if (progress % 10 === 0) {
              // 每 10% 显示一次
              process.stdout.write(`\r⏳ OCR 识别进度: ${progress}%`);
            }
          }
        },
        cachePath: cacheDir,
      });

      console.log("\n✅ OCR 引擎初始化完成");
    } catch (error) {
      console.error("\n❌ OCR 引擎初始化失败:", error);
      throw error;
    }
  }

  /**
   * 终止 Worker
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      console.log("\n🛑 OCR 引擎已关闭");
    }
  }

  /**
   * 将 PDF 页面转换为图片
   */
  private async convertPdfToImages(
    pdfPath: string,
    outputDir: string
  ): Promise<string[]> {
    const options = {
      density: this.options.dpi,
      saveFilename: path.basename(pdfPath, ".pdf"),
      savePath: outputDir,
      format: "png",
      width: 2480, // A4 @ 300 DPI
      height: 3508,
    };

    const convert = fromPath(pdfPath, options);
    const imagePaths: string[] = [];

    // 获取 PDF 总页数
    const dataBuffer = fs.readFileSync(pdfPath);
    const parser = await import("pdf-parse");
    const { PDFParse } = parser;
    const pdfParser = new PDFParse({ data: dataBuffer, verbosity: 0 });
    const info = await pdfParser.getInfo();
    const pageCount = info.total;

    console.log(`📄 PDF 共 ${pageCount} 页，开始转换为图片...`);

    // 转换所有页面
    for (let i = 1; i <= pageCount; i++) {
      try {
        const result = await convert(i, { responseType: "image" });
        if (result.path) {
          imagePaths.push(result.path);
          process.stdout.write(`\r🖼️  转换进度: ${i}/${pageCount} 页`);
        }
      } catch (error) {
        console.error(`\n❌ 第 ${i} 页转换失败:`, error);
      }
    }

    console.log(`\n✅ 图片转换完成，共 ${imagePaths.length} 张`);
    return imagePaths;
  }

  /**
   * 对图片进行 OCR 识别
   */
  private async recognizeImage(imagePath: string): Promise<string> {
    if (!this.worker) {
      throw new Error("OCR Worker 未初始化");
    }

    const {
      data: { text },
    } = await this.worker.recognize(imagePath);
    return text;
  }

  /**
   * 处理 PDF 文件，使用 OCR 提取文本
   */
  async processPdf(pdfPath: string, outputDir: string): Promise<OCRResult> {
    try {
      await this.initialize();

      // 创建临时图片目录
      const tempImageDir = path.join(
        outputDir,
        `ocr_temp_${Date.now()}`
      );
      fs.mkdirSync(tempImageDir, { recursive: true });

      // 转换 PDF 为图片
      const imagePaths = await this.convertPdfToImages(pdfPath, tempImageDir);

      if (imagePaths.length === 0) {
        throw new Error("PDF 转换图片失败，没有生成任何图片");
      }

      // 对每张图片进行 OCR 识别
      console.log(`🔍 开始 OCR 识别...`);
      const textPages: string[] = [];

      for (let i = 0; i < imagePaths.length; i++) {
        const imagePath = imagePaths[i];
        console.log(`\n📝 识别第 ${i + 1}/${imagePaths.length} 页...`);

        try {
          const text = await this.recognizeImage(imagePath);
          textPages.push(text);
        } catch (error) {
          console.error(`❌ 第 ${i + 1} 页 OCR 识别失败:`, error);
          textPages.push(""); // 添加空文本，保持页码对应
        }
      }

      // 合并所有页面的文本
      const fullText = textPages.join("\n\n--- PAGE BREAK ---\n\n");

      // 清理临时图片
      if (!this.options.saveImages) {
        console.log(`🧹 清理临时图片...`);
        for (const imagePath of imagePaths) {
          try {
            fs.unlinkSync(imagePath);
          } catch {
            // 忽略删除错误
          }
        }
        try {
          fs.rmdirSync(tempImageDir);
        } catch {
          // 忽略删除目录错误
        }
      } else if (this.options.imageOutputDir) {
        console.log(`💾 保存图片到: ${this.options.imageOutputDir}`);
      }

      console.log(`\n✅ OCR 识别完成`);

      return {
        success: true,
        text: fullText,
        processedPages: imagePaths.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        processedPages: 0,
      };
    } finally {
      await this.terminate();
    }
  }

  /**
   * 检测 PDF 是否需要 OCR
   * 如果 PDF 提取的文本太少，可能是扫描版，需要 OCR
   */
  static async needsOCR(pdfPath: string): Promise<boolean> {
    try {
      const dataBuffer = fs.readFileSync(pdfPath);
      const parser = await import("pdf-parse");
      const { PDFParse } = parser;
      const pdfParser = new PDFParse({ data: dataBuffer, verbosity: 0 });
      const result = await pdfParser.getText();

      const textLength = result.text.trim().length;
      const pageCount = result.total;

      // 如果平均每页文本少于 100 个字符，认为需要 OCR
      const avgCharsPerPage = textLength / pageCount;
      const needsOCR = avgCharsPerPage < 100;

      if (needsOCR) {
        console.log(
          `📊 检测到扫描版 PDF (平均每页 ${Math.round(
            avgCharsPerPage
          )} 字符)，将使用 OCR`
        );
      } else {
        console.log(
          `📊 检测到文本版 PDF (平均每页 ${Math.round(
            avgCharsPerPage
          )} 字符)，无需 OCR`
        );
      }

      return needsOCR;
    } catch (error) {
      console.warn("⚠️  PDF 文本检测失败，默认使用 OCR", error);
      return true; // 如果检测失败，默认使用 OCR
    }
  }
}
