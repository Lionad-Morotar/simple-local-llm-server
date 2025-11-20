const { parentPort, workerData } = require("worker_threads");
const fs = require("fs");
const path = require("path");

/**
 * Worker 线程：将文本格式化并保存为最终的 TXT 文件
 */
async function convertText() {
  try {
    const { textPath, txtPath } = workerData;

    // 读取临时文本文件
    const text = fs.readFileSync(textPath, "utf-8");

    // 格式化文本（段落处理）
    const paragraphs = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // 将段落用双换行分隔
    const formattedText = paragraphs.join("\n\n");

    // 保存为最终的 TXT 文件
    fs.writeFileSync(txtPath, formattedText, "utf-8");

    parentPort.postMessage({
      success: true,
      filename: path.basename(textPath),
    });
  } catch (error) {
    parentPort.postMessage({
      success: false,
      filename: workerData.textPath
        ? path.basename(workerData.textPath)
        : "unknown",
      error: {
        message: error.message,
        stack: error.stack,
      },
    });
  }
}

convertText();
