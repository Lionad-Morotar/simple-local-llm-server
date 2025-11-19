import fs from "fs";
import path from "path";
import { Worker } from "worker_threads";

const HTML_DIR = path.join(__dirname, ".html");
const MD_DIR = path.join(__dirname, ".md");
const CONFIG_DIR = path.join(__dirname, ".config");
const ERROR_LOG_FILE = path.join(CONFIG_DIR, "error.json");
const WORKER_COUNT = 10;

/**
 * 确保目录存在
 */
function ensureDirectoryExists(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * 获取所有 HTML 文件
 */
function getHtmlFiles(dir: string): string[] {
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".html"));
}

/**
 * 检查文件是否已转换
 */
function isAlreadyConverted(htmlFilename: string): boolean {
  const mdFilename = htmlFilename.replace(/\.html$/, ".md");
  const mdPath = path.join(MD_DIR, mdFilename);
  return fs.existsSync(mdPath);
}

/**
 * 读取错误记录
 */
function getErrorList(): string[] {
  try {
    if (fs.existsSync(ERROR_LOG_FILE)) {
      const content = fs.readFileSync(ERROR_LOG_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("读取错误记录失败:", error);
  }
  return [];
}

/**
 * 添加错误记录
 */
function addErrorFile(filename: string, _error: any): void {
  try {
    ensureDirectoryExists(CONFIG_DIR);
    const errorList = getErrorList();
    if (!errorList.includes(filename)) {
      errorList.push(filename);
      fs.writeFileSync(ERROR_LOG_FILE, JSON.stringify(errorList, null, 2));
    }
  } catch (err) {
    console.error("保存错误记录失败:", err);
  }
}

/**
 * 检查文件是否在错误列表中
 */
function isErrorFile(filename: string): boolean {
  const errorList = getErrorList();
  return errorList.includes(filename);
}

/**
 * Worker 线程处理任务
 */
function processInWorker(
  htmlPath: string,
  mdPath: string
): Promise<{ success: boolean; filename: string; error?: Error }> {
  return new Promise((resolve) => {
    let resolved = false;
    const worker = new Worker(path.join(__dirname, "worker.js"), {
      workerData: { htmlPath, mdPath },
    });

    const cleanup = (result: { success: boolean; filename: string; error?: Error }) => {
      if (resolved) return;
      resolved = true;
      worker.terminate().catch(() => {});
      resolve(result);
    };

    worker.on("message", (result) => {
      cleanup(result);
    });

    worker.on("error", (error) => {
      cleanup({
        success: false,
        filename: path.basename(htmlPath),
        error,
      });
    });

    worker.on("exit", (code) => {
      if (code !== 0 && !resolved) {
        cleanup({
          success: false,
          filename: path.basename(htmlPath),
          error: new Error(`Worker stopped with exit code ${code}`),
        });
      }
    });
  });
}

/**
 * 批量转换 HTML 文件（并发）
 */
async function batchConvert(): Promise<void> {
  ensureDirectoryExists(MD_DIR);

  const htmlFiles = getHtmlFiles(HTML_DIR);
  const total = htmlFiles.length;

  if (total === 0) {
    console.log("📂 未找到任何 HTML 文件");
    return;
  }

  // 过滤已转换的文件和出错的文件
  const filesToConvert = htmlFiles.filter((filename) => {
    if (isAlreadyConverted(filename)) {
      console.log(`⏭️  跳过已转换: ${filename}`);
      return false;
    }
    if (isErrorFile(filename)) {
      console.log(`⚠️  跳过出错文件: ${filename}`);
      return false;
    }
    return true;
  });

  const toConvertCount = filesToConvert.length;
  const skippedCount = total - toConvertCount;

  if (toConvertCount === 0) {
    console.log("✨ 所有文件已转换完成");
    return;
  }

  console.log(
    `🚀 开始转换 ${toConvertCount} 个文件 (跳过 ${skippedCount} 个已转换)\n`
  );

  let completed = 0;
  let currentIndex = 0;

  // 工作池：控制并发数量
  const processNext = async (): Promise<void> => {
    if (currentIndex >= filesToConvert.length) {
      return;
    }

    const index = currentIndex++;
    const filename = filesToConvert[index];
    const htmlPath = path.join(HTML_DIR, filename);
    const mdFilename = filename.replace(/\.html$/, ".md");
    const mdPath = path.join(MD_DIR, mdFilename);

    try {
      const result = await processInWorker(htmlPath, mdPath);
      completed++;
      
      if (result.success) {
        console.log(
          `✅ [${completed}/${toConvertCount}] ${filename} → ${mdFilename}`
        );
      } else {
        console.error(
          `❌ [${completed}/${toConvertCount}] ${filename} 转换失败:`,
          result.error
        );
        addErrorFile(filename, result.error);
      }
    } catch (error) {
      completed++;
      console.error(
        `❌ [${completed}/${toConvertCount}] ${filename} 处理异常:`,
        error
      );
      addErrorFile(filename, error);
    }

    // 继续处理下一个文件
    await processNext();
  };

  // 启动工作池
  const workers = Array(Math.min(WORKER_COUNT, filesToConvert.length))
    .fill(0)
    .map(() => processNext());

  await Promise.all(workers);

  console.log(
    `\n🎉 转换完成！共处理 ${toConvertCount} 个文件，跳过 ${skippedCount} 个`
  );
}

// 执行转换
batchConvert();
