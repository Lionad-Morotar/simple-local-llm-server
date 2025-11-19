import fs from "fs";
import path from "path";
import os from "os";
import { Worker } from "worker_threads";

const HTML_DIR = path.join(__dirname, ".html");
const MD_DIR = path.join(__dirname, ".md");
const CONFIG_DIR = path.join(__dirname, ".config");
const ERROR_LOG_FILE = path.join(CONFIG_DIR, "error.json");
const TARGET_CPU_USAGE = 0.8; // 目标 CPU 使用率 80%
const MIN_WORKERS = 2;
const MAX_WORKERS = os.cpus().length * 2;
let WORKER_COUNT = Math.min(10, MAX_WORKERS);

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
 * 获取当前 CPU 使用率
 */
function getCPUUsage(): Promise<number> {
  return new Promise((resolve) => {
    const startMeasure = os.cpus();
    
    setTimeout(() => {
      const endMeasure = os.cpus();
      let totalIdle = 0;
      let totalTick = 0;

      for (let i = 0; i < startMeasure.length; i++) {
        const start = startMeasure[i].times;
        const end = endMeasure[i].times;

        const idle = end.idle - start.idle;
        const total =
          end.user +
          end.nice +
          end.sys +
          end.idle +
          end.irq -
          (start.user + start.nice + start.sys + start.idle + start.irq);

        totalIdle += idle;
        totalTick += total;
      }

      const usage = 1 - totalIdle / totalTick;
      resolve(usage);
    }, 100);
  });
}

/**
 * 动态调整 Worker 数量
 */
async function adjustWorkerCount(activeWorkers: number): Promise<number> {
  const cpuUsage = await getCPUUsage();
  let newWorkerCount = WORKER_COUNT;

  if (cpuUsage < TARGET_CPU_USAGE - 0.1 && WORKER_COUNT < MAX_WORKERS) {
    // CPU 使用率低于 70%，增加 Worker
    newWorkerCount = Math.min(WORKER_COUNT + 2, MAX_WORKERS);
    if (newWorkerCount !== WORKER_COUNT) {
      console.log(`📈 CPU 使用率 ${(cpuUsage * 100).toFixed(1)}%，增加并发数: ${WORKER_COUNT} → ${newWorkerCount}`);
    }
  } else if (cpuUsage > TARGET_CPU_USAGE + 0.1 && WORKER_COUNT > MIN_WORKERS) {
    // CPU 使用率高于 90%，减少 Worker
    newWorkerCount = Math.max(WORKER_COUNT - 1, MIN_WORKERS, activeWorkers);
    if (newWorkerCount !== WORKER_COUNT) {
      console.log(`📉 CPU 使用率 ${(cpuUsage * 100).toFixed(1)}%，减少并发数: ${WORKER_COUNT} → ${newWorkerCount}`);
    }
  }

  WORKER_COUNT = newWorkerCount;
  return newWorkerCount;
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
    `🚀 开始转换 ${toConvertCount} 个文件 (跳过 ${skippedCount} 个已转换)`
  );
  console.log(`💻 CPU 核心数: ${os.cpus().length}，初始并发数: ${WORKER_COUNT}\n`);

  let completed = 0;
  let currentIndex = 0;
  let activeWorkers = 0;
  const workerPromises = new Set<Promise<void>>();
  let lastAdjustTime = Date.now();

  // 工作池：控制并发数量
  const processNext = async (): Promise<void> => {
    while (currentIndex < filesToConvert.length) {
      // 检查是否需要调整 Worker 数量（每 5 秒检查一次）
      if (Date.now() - lastAdjustTime > 5000 && completed > 0) {
        lastAdjustTime = Date.now();
        const newWorkerCount = await adjustWorkerCount(activeWorkers);
        
        // 如果增加了并发数，启动新的 Worker
        if (newWorkerCount > activeWorkers) {
          const additionalWorkers = newWorkerCount - activeWorkers;
          for (let i = 0; i < additionalWorkers && currentIndex < filesToConvert.length; i++) {
            const promise = processNext();
            workerPromises.add(promise);
            promise.finally(() => workerPromises.delete(promise));
          }
        }
      }

      // 如果当前活跃 Worker 超过限制，等待
      if (activeWorkers >= WORKER_COUNT) {
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }

      const index = currentIndex++;
      if (index >= filesToConvert.length) break;

      const filename = filesToConvert[index];
      const htmlPath = path.join(HTML_DIR, filename);
      const mdFilename = filename.replace(/\.html$/, ".md");
      const mdPath = path.join(MD_DIR, mdFilename);

      activeWorkers++;

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
      } finally {
        activeWorkers--;
      }
    }
  };

  // 启动初始工作池
  const initialWorkerCount = Math.min(WORKER_COUNT, filesToConvert.length);
  for (let i = 0; i < initialWorkerCount; i++) {
    const promise = processNext();
    workerPromises.add(promise);
    promise.finally(() => workerPromises.delete(promise));
  }

  await Promise.all(Array.from(workerPromises));

  console.log(
    `\n🎉 转换完成！共处理 ${toConvertCount} 个文件，跳过 ${skippedCount} 个`
  );
}

// 执行转换
batchConvert();
