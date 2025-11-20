import fs from "fs";
import path from "path";
import os from "os";
import { Worker } from "worker_threads";
import { DoneManager } from "./doneManager";
import { ErrorManager } from "./errorManager";

const TXT_DIR = path.join(__dirname, ".txt");
const SEGMENT_DIR = path.join(__dirname, ".segments");
const TARGET_CPU_USAGE = 0.8; // 目标 CPU 使用率 80%
const MIN_WORKERS = 2;
const MAX_WORKERS = os.cpus().length * 2;
let WORKER_COUNT = Math.min(10, MAX_WORKERS);

// 从环境变量读取配置
const STRATEGY = "advanced" as const; // 使用高级分段器
const MIN_LENGTH = parseInt(process.env.MIN_LENGTH || "50");
const MAX_LENGTH = parseInt(process.env.MAX_LENGTH || "500");
const PREFERRED_LENGTH = parseInt(process.env.PREFERRED_LENGTH || "200");
const OUTPUT_FORMAT = "json" as const; // 固定使用 JSON 格式
const WEIGHTS_PRESET = process.env.WEIGHTS_PRESET || "default"; // 权重预设
const CUSTOM_STRATEGY = process.env.CUSTOM_STRATEGY; // 自定义策略文件路径
const WINDOW_SIZE = parseInt(process.env.WINDOW_SIZE || "1000"); // 滑动窗口大小
const STEP_SIZE = parseInt(process.env.STEP_SIZE || "500"); // 步进大小

// 初始化管理器
const doneManager = new DoneManager();
const errorManager = new ErrorManager();

/**
 * 确保目录存在
 */
function ensureDirectoryExists(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * 获取所有 TXT 文件
 */
function getTxtFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs.readdirSync(dir).filter((file) => file.endsWith(".txt"));
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
    newWorkerCount = Math.min(WORKER_COUNT + 2, MAX_WORKERS);
    if (newWorkerCount !== WORKER_COUNT) {
      console.log(
        `📈 CPU 使用率 ${(cpuUsage * 100).toFixed(1)}%，增加并发数: ${WORKER_COUNT} → ${newWorkerCount}`
      );
    }
  } else if (cpuUsage > TARGET_CPU_USAGE + 0.1 && WORKER_COUNT > MIN_WORKERS) {
    newWorkerCount = Math.max(WORKER_COUNT - 1, MIN_WORKERS, activeWorkers);
    if (newWorkerCount !== WORKER_COUNT) {
      console.log(
        `📉 CPU 使用率 ${(cpuUsage * 100).toFixed(1)}%，减少并发数: ${WORKER_COUNT} → ${newWorkerCount}`
      );
    }
  }

  WORKER_COUNT = newWorkerCount;
  return newWorkerCount;
}

/**
 * Worker 线程处理任务
 */
function processInWorker(
  txtPath: string,
  segmentPath: string,
  config: {
    strategy: string;
    minLength: number;
    maxLength: number;
    preferredLength: number;
    outputFormat: string;
  }
): Promise<{
  success: boolean;
  filename: string;
  segmentCount?: number;
  qualityScore?: number;
  error?: Error;
}> {
  return new Promise((resolve) => {
    let resolved = false;
    const worker = new Worker(path.join(__dirname, "worker.js"), {
      workerData: { txtPath, segmentPath, config },
    });

    const cleanup = (result: {
      success: boolean;
      filename: string;
      segmentCount?: number;
      qualityScore?: number;
      error?: Error;
    }) => {
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
        filename: path.basename(txtPath),
        error,
      });
    });

    worker.on("exit", (code) => {
      if (code !== 0 && !resolved) {
        cleanup({
          success: false,
          filename: path.basename(txtPath),
          error: new Error(`Worker stopped with exit code ${code}`),
        });
      }
    });
  });
}

/**
 * 批量转换 TXT 文件（并发）
 */
async function batchSegment(): Promise<void> {
  ensureDirectoryExists(SEGMENT_DIR);

  const txtFiles = getTxtFiles(TXT_DIR);
  const total = txtFiles.length;

  if (total === 0) {
    console.log("📂 未找到任何 TXT 文件");
    console.log(`💡 请将 .txt 文件放在 ${TXT_DIR} 目录下`);
    return;
  }

  // 过滤已处理的文件和出错的文件
  const filesToProcess = txtFiles.filter((filename) => {
    if (doneManager.isDone(filename)) {
      console.log(`⏭️  跳过已处理: ${filename}`);
      return false;
    }
    if (errorManager.hasError(filename)) {
      console.log(`⚠️  跳过出错文件: ${filename}`);
      return false;
    }
    return true;
  });

  const toProcessCount = filesToProcess.length;
  const skippedCount = total - toProcessCount;

  if (toProcessCount === 0) {
    console.log("✨ 所有文件已处理完成");
    return;
  }

  console.log(`🚀 开始分段 ${toProcessCount} 个文件 (跳过 ${skippedCount} 个已处理)`);
  console.log(`💻 CPU 核心数: ${os.cpus().length}，初始并发数: ${WORKER_COUNT}`);
  console.log(`⚙️  高级分段器 (权重: ${WEIGHTS_PRESET}), 长度范围: ${MIN_LENGTH}-${MAX_LENGTH} 字`);
  console.log(`📐 滑动窗口: ${WINDOW_SIZE} 字, 步进: ${STEP_SIZE} 字, JSON 输出`);
  if (CUSTOM_STRATEGY) {
    console.log(`🔌 自定义策略: ${CUSTOM_STRATEGY}`);
  }
  console.log();

  let completed = 0;
  let currentIndex = 0;
  let activeWorkers = 0;
  const workerPromises = new Set<Promise<void>>();
  let lastAdjustTime = Date.now();

  // 工作池：控制并发数量
  const processNext = async (): Promise<void> => {
    while (currentIndex < filesToProcess.length) {
      // 检查是否需要调整 Worker 数量（每 5 秒检查一次）
      if (Date.now() - lastAdjustTime > 5000 && completed > 0) {
        lastAdjustTime = Date.now();
        const newWorkerCount = await adjustWorkerCount(activeWorkers);

        if (newWorkerCount > activeWorkers) {
          const additionalWorkers = newWorkerCount - activeWorkers;
          for (
            let i = 0;
            i < additionalWorkers && currentIndex < filesToProcess.length;
            i++
          ) {
            const promise = processNext();
            workerPromises.add(promise);
            promise.finally(() => workerPromises.delete(promise));
          }
        }
      }

      // 如果当前活跃 Worker 超过限制，等待
      if (activeWorkers >= WORKER_COUNT) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        continue;
      }

      const index = currentIndex++;
      if (index >= filesToProcess.length) break;

      const filename = filesToProcess[index];
      const txtPath = path.join(TXT_DIR, filename);
      const segmentFilename =
        OUTPUT_FORMAT === "json"
          ? filename.replace(/\.txt$/, ".segments.json")
          : filename.replace(/\.txt$/, ".segments.txt");
      const segmentPath = path.join(SEGMENT_DIR, segmentFilename);

      activeWorkers++;

      try {
        console.log(`🔄 [${completed + 1}/${toProcessCount}] 处理文本: ${filename}`);

        const result = await processInWorker(txtPath, segmentPath, {
          strategy: STRATEGY,
          minLength: MIN_LENGTH,
          maxLength: MAX_LENGTH,
          preferredLength: PREFERRED_LENGTH,
          outputFormat: OUTPUT_FORMAT,
          weightsPreset: WEIGHTS_PRESET,
          customStrategy: CUSTOM_STRATEGY,
          windowSize: WINDOW_SIZE,
          stepSize: STEP_SIZE,
        });

        completed++;

        if (result.success) {
          console.log(
            `✅ [${completed}/${toProcessCount}] ${filename} → ${segmentFilename} (${result.segmentCount}段, 质量${result.qualityScore}/100)`
          );
          doneManager.addDone(
            filename,
            STRATEGY,
            result.segmentCount || 0,
            result.qualityScore || 0
          );
        } else {
          throw result.error || new Error("Worker 处理失败");
        }
      } catch (error) {
        completed++;
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(
          `❌ [${completed}/${toProcessCount}] ${filename} 分段失败: ${errorMessage}`
        );
        errorManager.addError(
          filename,
          error instanceof Error ? error : new Error(String(error))
        );
      } finally {
        activeWorkers--;
      }
    }
  };

  // 启动初始工作池
  const initialWorkerCount = Math.min(WORKER_COUNT, filesToProcess.length);
  for (let i = 0; i < initialWorkerCount; i++) {
    const promise = processNext();
    workerPromises.add(promise);
    promise.finally(() => workerPromises.delete(promise));
  }

  await Promise.all(Array.from(workerPromises));

  console.log(
    `\n🎉 分段完成！共处理 ${toProcessCount} 个文件，跳过 ${skippedCount} 个`
  );

  // 显示统计信息
  const stats = doneManager.getStats();
  const errors = errorManager.getErrors();
  console.log(`\n📊 统计信息:`);
  console.log(`   ✅ 成功: ${stats.total} 个`);
  console.log(`   📈 平均质量: ${stats.avgQuality}/100`);
  console.log(`   📝 平均段落数: ${stats.avgSegments} 段`);
  console.log(`   ❌ 失败: ${errors.length} 个`);
}

// 执行分段
batchSegment();
