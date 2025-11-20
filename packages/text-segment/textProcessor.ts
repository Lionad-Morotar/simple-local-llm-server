/**
 * 文本处理器 - 整合分段策略和质量评估
 */

import fs from "fs";
import {
  SegmentStrategy,
  SegmentConfig,
  Segment,
  StrategyFactory,
} from "./segmentStrategies";
import { QualityEvaluator, QualityMetrics } from "./qualityEvaluator";

export interface ProcessConfig extends SegmentConfig {
  strategy?: SegmentStrategy; // 分段策略，默认 'semantic'
  evaluateQuality?: boolean; // 是否评估质量，默认 true
  outputFormat?: "json" | "text"; // 输出格式，默认 'text'
}

export interface ProcessResult {
  success: boolean;
  segments?: Segment[];
  quality?: QualityMetrics;
  error?: Error;
  outputPath?: string;
}

/**
 * 文本分段处理器
 */
export class TextProcessor {
  /**
   * 处理文本文件
   */
  static async processFile(
    inputPath: string,
    outputPath: string,
    config: ProcessConfig = {}
  ): Promise<ProcessResult> {
    try {
      // 读取文本
      const text = fs.readFileSync(inputPath, "utf-8");

      // 处理分段
      const result = this.processText(text, config);

      if (!result.success) {
        return result;
      }

      // 保存结果
      this.saveSegments(outputPath, result.segments!, config);

      return {
        ...result,
        outputPath,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * 处理文本内容
   */
  static processText(
    text: string,
    config: ProcessConfig = {}
  ): ProcessResult {
    try {
      const strategy = config.strategy || "semantic";
      const segmentConfig: SegmentConfig = {
        minLength: config.minLength || 50,
        maxLength: config.maxLength || 500,
        preferredLength: config.preferredLength || 200,
      };

      // 执行分段
      const strategyInstance = StrategyFactory.create(strategy);
      const segments = strategyInstance.segment(text, segmentConfig);

      // 评估质量
      let quality: QualityMetrics | undefined;
      if (config.evaluateQuality !== false) {
        quality = QualityEvaluator.evaluate(segments, {
          minLength: segmentConfig.minLength!,
          maxLength: segmentConfig.maxLength!,
          preferredLength: segmentConfig.preferredLength!,
        });
      }

      return {
        success: true,
        segments,
        quality,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * 保存分段结果
   */
  private static saveSegments(
    outputPath: string,
    segments: Segment[],
    config: ProcessConfig
  ): void {
    const format = config.outputFormat || "text";

    if (format === "json") {
      // JSON 格式：保存完整的分段信息
      const data = {
        totalSegments: segments.length,
        config,
        segments: segments.map((s, i) => ({
          index: i + 1,
          text: s.text,
          length: s.length,
          startIndex: s.startIndex,
          endIndex: s.endIndex,
        })),
      };
      fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), "utf-8");
    } else {
      // 文本格式：每个段落用特殊分隔符分开
      const content = segments
        .map((s, i) => {
          return `[段落 ${i + 1}] (${s.length}字)\n${s.text}`;
        })
        .join("\n\n" + "=".repeat(60) + "\n\n");

      fs.writeFileSync(outputPath, content, "utf-8");
    }
  }

  /**
   * 比较不同策略的效果
   */
  static compareStrategies(
    text: string,
    config: SegmentConfig = {}
  ): {
    strategy: SegmentStrategy;
    segments: Segment[];
    quality: QualityMetrics;
  }[] {
    const strategies: SegmentStrategy[] = [
      "double-newline",
      "sentence",
      "semantic",
      "mixed",
    ];

    const results = strategies.map((strategy) => {
      const strategyInstance = StrategyFactory.create(strategy);
      const segments = strategyInstance.segment(text, config);
      const quality = QualityEvaluator.evaluate(segments, {
        minLength: config.minLength || 50,
        maxLength: config.maxLength || 500,
        preferredLength: config.preferredLength || 200,
      });

      return {
        strategy,
        segments,
        quality,
      };
    });

    // 按质量评分降序排序
    results.sort((a, b) => b.quality.overallScore - a.quality.overallScore);

    return results;
  }

  /**
   * 自动选择最佳策略
   */
  static chooseBestStrategy(
    text: string,
    config: SegmentConfig = {}
  ): SegmentStrategy {
    const results = this.compareStrategies(text, config);
    return results[0].strategy;
  }
}
