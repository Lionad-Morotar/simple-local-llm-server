/**
 * 高级分段器 - 基于权重的智能分段
 */

import { Segment, SegmentConfig } from "./segmentStrategies";
import { StrategyWeights, getWeights } from "./strategyWeights";

export interface AdvancedSegmentConfig extends SegmentConfig {
  weights?: StrategyWeights | string; // 权重配置或预设名称
  windowSize?: number; // 滑动窗口大小（字符数）
  stepSize?: number; // 步进大小（字符数）
}

interface BoundaryScore {
  position: number;
  score: number;
  type: 'paragraph' | 'sentence' | 'length' | 'semantic';
  reason: string;
}

/**
 * 高级分段器类
 */
export class AdvancedSegmenter {
  private weights: StrategyWeights;
  private config: Required<AdvancedSegmentConfig>;

  constructor(config: AdvancedSegmentConfig = {}) {
    // 解析权重配置
    if (typeof config.weights === 'string') {
      this.weights = getWeights(config.weights);
    } else if (config.weights) {
      this.weights = config.weights;
    } else {
      this.weights = getWeights('default');
    }

    // 默认配置
    this.config = {
      minLength: config.minLength || 50,
      maxLength: config.maxLength || 500,
      preferredLength: config.preferredLength || 200,
      weights: this.weights,
      windowSize: config.windowSize || 1000,
      stepSize: config.stepSize || 500,
    };
  }

  /**
   * 主分段方法
   */
  segment(text: string): Segment[] {
    const segments: Segment[] = [];
    let currentPosition = 0;

    while (currentPosition < text.length) {
      // 提取窗口文本
      const windowEnd = Math.min(
        currentPosition + this.config.windowSize,
        text.length
      );
      const window = text.substring(currentPosition, windowEnd);

      // 在窗口内找到最佳分段点
      const bestBoundary = this.findBestBoundary(window, currentPosition);

      if (bestBoundary) {
        // 创建段落
        const segmentText = text.substring(currentPosition, bestBoundary.position);
        if (segmentText.trim().length > 0) {
          segments.push({
            text: segmentText.trim(),
            startIndex: currentPosition,
            endIndex: bestBoundary.position,
            length: segmentText.trim().length,
          });
        }
        currentPosition = bestBoundary.position;
      } else {
        // 没有找到合适的分段点，使用默认步进
        const nextPosition = Math.min(
          currentPosition + this.config.stepSize,
          text.length
        );
        const segmentText = text.substring(currentPosition, nextPosition);
        if (segmentText.trim().length > 0) {
          segments.push({
            text: segmentText.trim(),
            startIndex: currentPosition,
            endIndex: nextPosition,
            length: segmentText.trim().length,
          });
        }
        currentPosition = nextPosition;
      }
    }

    return this.postProcess(segments);
  }

  /**
   * 在窗口内找到最佳分段点
   */
  private findBestBoundary(window: string, offset: number): BoundaryScore | null {
    const candidates: BoundaryScore[] = [];

    // 1. 检测段落边界（双换行）
    const paragraphBoundaries = this.detectParagraphBoundaries(window, offset);
    candidates.push(...paragraphBoundaries);

    // 2. 检测句子边界
    const sentenceBoundaries = this.detectSentenceBoundaries(window, offset);
    candidates.push(...sentenceBoundaries);

    // 3. 检测长度优化点
    const lengthBoundaries = this.detectLengthBoundaries(window, offset);
    candidates.push(...lengthBoundaries);

    // 选择得分最高的边界
    if (candidates.length === 0) return null;

    candidates.sort((a, b) => b.score - a.score);
    return candidates[0];
  }

  /**
   * 检测段落边界（双换行）- 最高优先级
   */
  private detectParagraphBoundaries(window: string, offset: number): BoundaryScore[] {
    const boundaries: BoundaryScore[] = [];
    const regex = /\n\n+/g;
    let match;

    while ((match = regex.exec(window)) !== null) {
      const position = offset + match.index + match[0].length;
      const currentLength = match.index;

      // 计算得分：段落边界基础分 + 长度合理性加成
      let score = this.weights.paragraphBoundary * 100;

      // 长度在合理范围内加分
      if (currentLength >= this.config.minLength && currentLength <= this.config.maxLength) {
        score += 20;
      } else if (currentLength >= this.config.minLength) {
        score += 10;
      }

      boundaries.push({
        position,
        score,
        type: 'paragraph',
        reason: `段落边界(${match[0].length}个换行)`,
      });
    }

    return boundaries;
  }

  /**
   * 检测句子边界
   */
  private detectSentenceBoundaries(window: string, offset: number): BoundaryScore[] {
    const boundaries: BoundaryScore[] = [];
    const regex = /[。！？!?；;]\s*/g;
    let match;

    while ((match = regex.exec(window)) !== null) {
      const position = offset + match.index + match[0].length;
      const currentLength = match.index;

      // 句子边界得分
      let score = this.weights.sentenceBoundary * 100;

      // 长度合理性加成
      if (currentLength >= this.config.minLength && currentLength <= this.config.maxLength) {
        score += 15;
      } else if (currentLength >= this.config.minLength) {
        score += 5;
      }

      // 完整句子加分（不在引号内）
      const beforeMatch = window.substring(0, match.index);
      const openQuotes = (beforeMatch.match(/["'「『]/g) || []).length;
      const closeQuotes = (beforeMatch.match(/["'」』]/g) || []).length;
      if (openQuotes === closeQuotes) {
        score += 10;
      }

      boundaries.push({
        position,
        score,
        type: 'sentence',
        reason: `句子边界(${match[0]})`,
      });
    }

    return boundaries;
  }

  /**
   * 检测长度优化点
   */
  private detectLengthBoundaries(window: string, offset: number): BoundaryScore[] {
    const boundaries: BoundaryScore[] = [];
    
    // 在首选长度附近查找合适的分段点
    const targetPosition = this.config.preferredLength;
    
    if (targetPosition >= window.length) return boundaries;

    // 在目标位置前后查找自然断点
    const searchStart = Math.max(0, targetPosition - 50);
    const searchEnd = Math.min(window.length, targetPosition + 50);
    const searchWindow = window.substring(searchStart, searchEnd);

    // 查找空格、标点等自然断点
    const naturalBreaks = /[\s\n,，、。！？!?；;]/g;
    let match;

    while ((match = naturalBreaks.exec(searchWindow)) !== null) {
      const position = offset + searchStart + match.index + match[0].length;
      const distance = Math.abs((searchStart + match.index) - targetPosition);
      
      // 距离越近得分越高
      const proximityScore = 1 - (distance / 50);
      const score = this.weights.lengthOptimization * 100 * proximityScore;

      boundaries.push({
        position,
        score,
        type: 'length',
        reason: `长度优化点(距首选长度${distance}字)`,
      });
    }

    return boundaries;
  }

  /**
   * 后处理：合并过短段落，拆分过长段落
   */
  private postProcess(segments: Segment[]): Segment[] {
    const result: Segment[] = [];
    let i = 0;

    while (i < segments.length) {
      const segment = segments[i];

      // 处理过短段落
      if (segment.length < this.config.minLength && i < segments.length - 1) {
        const next = segments[i + 1];
        const merged = {
          text: segment.text + '\n\n' + next.text,
          startIndex: segment.startIndex,
          endIndex: next.endIndex,
          length: segment.length + next.length + 2,
        };

        if (merged.length <= this.config.maxLength) {
          result.push(merged);
          i += 2;
          continue;
        }
      }

      // 处理过长段落
      if (segment.length > this.config.maxLength) {
        const subSegments = this.splitLongSegment(segment);
        result.push(...subSegments);
      } else {
        result.push(segment);
      }

      i++;
    }

    return result;
  }

  /**
   * 拆分过长段落
   */
  private splitLongSegment(segment: Segment): Segment[] {
    const text = segment.text;
    const sentences = text.split(/([。！？!?；;]\s*)/g).filter(s => s.trim());
    
    const result: Segment[] = [];
    let currentText = '';
    let currentStart = segment.startIndex;

    for (const sentence of sentences) {
      if (currentText.length + sentence.length > this.config.maxLength && currentText) {
        result.push({
          text: currentText.trim(),
          startIndex: currentStart,
          endIndex: currentStart + currentText.length,
          length: currentText.trim().length,
        });
        currentStart += currentText.length;
        currentText = sentence;
      } else {
        currentText += sentence;
      }
    }

    if (currentText.trim()) {
      result.push({
        text: currentText.trim(),
        startIndex: currentStart,
        endIndex: segment.endIndex,
        length: currentText.trim().length,
      });
    }

    return result;
  }
}
