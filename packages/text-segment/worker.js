const { parentPort, workerData } = require("worker_threads");
const fs = require("fs");
const path = require("path");

// 动态导入 TypeScript 模块
async function processSegment() {
  try {
    const { txtPath, segmentPath, config } = workerData;

    // 使用 require 导入编译后的模块
    const { AdvancedSegmenter } = require("./advancedSegmenter");
    const { QualityEvaluator } = require("./qualityEvaluator");
    const { StrategyLoader } = require("./strategyLoader");

    // 加载自定义策略（如果提供）
    if (config.customStrategy) {
      await StrategyLoader.loadStrategyFromFile(config.customStrategy);
    }

    // 读取文本
    const text = fs.readFileSync(txtPath, "utf-8");

    // 创建高级分段器
    const segmenter = new AdvancedSegmenter({
      minLength: config.minLength,
      maxLength: config.maxLength,
      preferredLength: config.preferredLength,
      weights: config.weightsPreset || 'default',
      windowSize: config.windowSize || 1000,
      stepSize: config.stepSize || 500,
    });

    // 执行分段
    const segments = segmenter.segment(text);

    // 评估质量
    const quality = QualityEvaluator.evaluate(segments, {
      minLength: config.minLength,
      maxLength: config.maxLength,
      preferredLength: config.preferredLength,
    });

    if (config.outputFormat === "json") {
      const data = {
        filename: path.basename(txtPath),
        strategy: 'advanced',
        weightsPreset: config.weightsPreset || 'default',
        config: {
          minLength: config.minLength,
          maxLength: config.maxLength,
          preferredLength: config.preferredLength,
          windowSize: config.windowSize,
          stepSize: config.stepSize,
        },
        quality: quality,
        totalSegments: segments.length,
        segments: segments.map((s, i) => ({
          index: i + 1,
          text: s.text,
          length: s.length,
        })),
      };
      fs.writeFileSync(segmentPath, JSON.stringify(data, null, 2), "utf-8");
      
      // 额外生成仅包含文本数组的精简文件 *.text.json
      try {
        const textArrayPath = segmentPath.replace(/\.segments\.json$/, '.text.json');
        const textArray = segments.map(s => s.text);
        fs.writeFileSync(textArrayPath, JSON.stringify(textArray, null, 2), 'utf-8');
      } catch (e) {
        // 精简文件生成失败不影响主流程
      }
      
      // 额外生成 CSV 格式文件 *.text.csv
      try {
        const csvPath = segmentPath.replace(/\.segments\.json$/, '.text.csv');
        const csvRows = ['index,text,length'];
        segments.forEach((s, i) => {
          // CSV RFC 4180 转义规则:
          // 1. 双引号转义为两个双引号 " -> ""
          // 2. 包含双引号、逗号、换行符的字段必须用双引号包裹
          // 3. 换行符保留原样（\r\n 或 \n）
          const escapedText = s.text
            .replace(/\r\n/g, '\n')        // 统一换行符为 LF
            .replace(/\r/g, '\n');         // CR 转为 LF
          csvRows.push(`${i + 1},"${escapedText}",${s.length}`);
        });
        fs.writeFileSync(csvPath, csvRows.join('\n'), 'utf-8');
      } catch (e) {
        // CSV 文件生成失败不影响主流程
      }
    } else {
      // 文本格式
      const lines = [];

      // 添加质量报告
      if (quality) {
        lines.push(QualityEvaluator.generateReport(quality));
        lines.push("\n");
        lines.push("=".repeat(80));
        lines.push("\n");
      }

      // 添加段落内容
      segments.forEach((s, i) => {
        lines.push(`[段落 ${i + 1}] (${s.length}字)`);
        lines.push(s.text);
        lines.push("");
        lines.push("=".repeat(60));
        lines.push("");
      });

      fs.writeFileSync(segmentPath, lines.join("\n"), "utf-8");
    }

    parentPort.postMessage({
      success: true,
      filename: path.basename(txtPath),
      segmentCount: segments.length,
      qualityScore: quality ? quality.overallScore : 0,
    });
  } catch (error) {
    parentPort.postMessage({
      success: false,
      filename: workerData.txtPath
        ? path.basename(workerData.txtPath)
        : "unknown",
      error: {
        message: error.message,
        stack: error.stack,
      },
    });
  }
}

processSegment();
