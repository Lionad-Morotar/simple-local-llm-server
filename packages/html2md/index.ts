import fs from "fs";
import path from "path";
import { Worker } from "worker_threads";

const HTML_DIR = path.join(__dirname, ".html");
const MD_DIR = path.join(__dirname, ".md");
const WORKER_COUNT = 2; // 双线程

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
 * Worker 线程处理任务
 */
function processInWorker(
  htmlPath: string,
  mdPath: string
): Promise<{ success: boolean; filename: string; error?: Error }> {
  return new Promise((resolve) => {
    const worker = new Worker(path.join(__dirname, "worker.js"), {
      workerData: { htmlPath, mdPath },
    });

    worker.on("message", (result) => {
      resolve(result);
    });

    worker.on("error", (error) => {
      resolve({
        success: false,
        filename: path.basename(htmlPath),
        error,
      });
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

  // 过滤已转换的文件
  const filesToConvert = htmlFiles.filter((filename) => {
    if (isAlreadyConverted(filename)) {
      console.log(`⏭️  跳过已转换: ${filename}`);
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
  const tasks: Promise<any>[] = [];

  // 使用双线程并发处理
  for (let i = 0; i < filesToConvert.length; i += WORKER_COUNT) {
    const batch = filesToConvert.slice(i, i + WORKER_COUNT);

    const batchTasks = batch.map((filename) => {
      const htmlPath = path.join(HTML_DIR, filename);
      const mdFilename = filename.replace(/\.html$/, ".md");
      const mdPath = path.join(MD_DIR, mdFilename);

      return processInWorker(htmlPath, mdPath).then((result) => {
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
        }
        return result;
      });
    });

    tasks.push(...batchTasks);
    await Promise.all(batchTasks);
  }

  console.log(
    `\n🎉 转换完成！共处理 ${toConvertCount} 个文件，跳过 ${skippedCount} 个`
  );
}

// 执行转换
batchConvert();
