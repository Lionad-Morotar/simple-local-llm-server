const fs = require("fs");
const path = require("path");
const { parentPort, workerData } = require("worker_threads");

try {
  const { textPath, mdPath } = workerData;

  // 读取处理后的文本内容
  const textContent = fs.readFileSync(textPath, "utf-8");

  if (!textContent || textContent.trim().length === 0) {
    parentPort.postMessage({
      success: false,
      filename: path.basename(textPath),
      error: new Error("文本内容为空"),
    });
    return;
  }

  // 移除页码标记（如 "-- 1 of 73 --"）
  let cleanedText = textContent;
  cleanedText = cleanedText.replace(/--\s*\d+\s+of\s+\d+\s*--/gim, "");
  cleanedText = cleanedText.replace(/--\s*\d+\s*\/\s*\d+\s*--/gim, "");
  
  // 简单处理：为文本添加段落分隔
  // 将多个连续换行视为段落分隔
  const paragraphs = cleanedText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  // 生成 Markdown，每个段落之间添加空行
  const md = paragraphs.join("\n\n");

  fs.writeFileSync(mdPath, md, "utf-8");

  parentPort.postMessage({
    success: true,
    filename: path.basename(textPath),
  });
} catch (error) {
  parentPort.postMessage({
    success: false,
    filename: path.basename(workerData.textPath || "unknown"),
    error,
  });
}
