/**
 * 文本分段策略
 */

export interface Segment {
  text: string;
  startIndex: number;
  endIndex: number;
  length: number;
}

export interface SegmentConfig {
  minLength?: number; // 最小段落长度，默认 50
  maxLength?: number; // 最大段落长度，默认 500
  preferredLength?: number; // 首选段落长度，默认 200
}

export type SegmentStrategy =
  | "double-newline" // 双换行分段
  | "sentence" // 句号分段
  | "semantic" // 语义分段（智能）
  | "mixed"; // 混合策略

/**
 * 基础分段策略接口
 */
export interface ISegmentStrategy {
  name: string;
  segment(text: string, config: SegmentConfig): Segment[];
}

/**
 * 双换行分段策略
 * 按照双换行（段落）进行分段
 */
export class DoubleNewlineStrategy implements ISegmentStrategy {
  name = "double-newline";

  segment(text: string, config: SegmentConfig): Segment[] {
    const segments: Segment[] = [];
    const paragraphs = text.split(/\n\n+/);
    let currentIndex = 0;

    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (trimmed.length === 0) {
        currentIndex += para.length + 2; // +2 for \n\n
        continue;
      }

      segments.push({
        text: trimmed,
        startIndex: currentIndex,
        endIndex: currentIndex + trimmed.length,
        length: trimmed.length,
      });

      currentIndex += para.length + 2;
    }

    // 合并过短的段落
    return this.mergeShorSegments(segments, config);
  }

  private mergeShorSegments(
    segments: Segment[],
    config: SegmentConfig
  ): Segment[] {
    const minLength = config.minLength || 50;
    const maxLength = config.maxLength || 500;
    const result: Segment[] = [];
    let buffer: Segment[] = [];
    let bufferLength = 0;

    for (const segment of segments) {
      buffer.push(segment);
      bufferLength += segment.length;

      // 如果缓冲区长度达到最小长度，或者加上下一个会超过最大长度
      if (bufferLength >= minLength || bufferLength > maxLength / 2) {
        result.push(this.mergeSegments(buffer));
        buffer = [];
        bufferLength = 0;
      }
    }

    // 处理剩余的段落
    if (buffer.length > 0) {
      if (result.length > 0 && bufferLength < minLength) {
        // 合并到上一个段落
        const last = result.pop()!;
        result.push(this.mergeSegments([last, ...buffer]));
      } else {
        result.push(this.mergeSegments(buffer));
      }
    }

    return result;
  }

  private mergeSegments(segments: Segment[]): Segment {
    if (segments.length === 1) return segments[0];

    const text = segments.map((s) => s.text).join("\n\n");
    return {
      text,
      startIndex: segments[0].startIndex,
      endIndex: segments[segments.length - 1].endIndex,
      length: text.length,
    };
  }
}

/**
 * 句号分段策略
 * 按照句号、问号、感叹号等标点进行分段
 */
export class SentenceStrategy implements ISegmentStrategy {
  name = "sentence";

  segment(text: string, config: SegmentConfig): Segment[] {
    const minLength = config.minLength || 50;
    const maxLength = config.maxLength || 500;
    const preferredLength = config.preferredLength || 200;

    // 句子分隔符（中英文）
    const sentenceEnders = /([。！？!?;；][\s\n]*)/g;
    const sentences = text.split(sentenceEnders).filter((s) => s.trim());

    const segments: Segment[] = [];
    let currentText = "";
    let currentStart = 0;
    let currentIndex = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const isSeparator = /^[。！？!?;；][\s\n]*$/.test(sentence);

      if (isSeparator) {
        currentText += sentence;
        currentIndex += sentence.length;
        continue;
      }

      // 如果当前段落为空，开始新段落
      if (currentText === "") {
        currentStart = currentIndex;
      }

      currentText += sentence;
      currentIndex += sentence.length;

      // 判断是否应该结束当前段落
      const shouldEndSegment =
        currentText.length >= preferredLength || // 达到首选长度
        (currentText.length >= minLength && i === sentences.length - 1) || // 最后一句且达到最小长度
        currentText.length >= maxLength; // 超过最大长度

      if (shouldEndSegment) {
        segments.push({
          text: currentText.trim(),
          startIndex: currentStart,
          endIndex: currentIndex,
          length: currentText.trim().length,
        });
        currentText = "";
      }
    }

    // 处理剩余内容
    if (currentText.trim()) {
      if (
        segments.length > 0 &&
        currentText.trim().length < minLength &&
        segments[segments.length - 1].length < maxLength - currentText.length
      ) {
        // 合并到上一段
        const last = segments.pop()!;
        segments.push({
          text: last.text + "\n" + currentText.trim(),
          startIndex: last.startIndex,
          endIndex: currentIndex,
          length: last.length + currentText.trim().length,
        });
      } else {
        segments.push({
          text: currentText.trim(),
          startIndex: currentStart,
          endIndex: currentIndex,
          length: currentText.trim().length,
        });
      }
    }

    return segments;
  }
}

/**
 * 语义分段策略（智能）
 * 结合句子结构、关键词、长度等因素进行智能分段
 */
export class SemanticStrategy implements ISegmentStrategy {
  name = "semantic";

  segment(text: string, config: SegmentConfig): Segment[] {
    const minLength = config.minLength || 50;
    const maxLength = config.maxLength || 500;
    const preferredLength = config.preferredLength || 200;

    // 先按段落分割
    const paragraphs = text.split(/\n\n+/);
    const segments: Segment[] = [];
    let currentIndex = 0;

    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (trimmed.length === 0) {
        currentIndex += para.length + 2;
        continue;
      }

      // 如果段落长度在合理范围内，直接作为一段
      if (trimmed.length >= minLength && trimmed.length <= maxLength) {
        segments.push({
          text: trimmed,
          startIndex: currentIndex,
          endIndex: currentIndex + trimmed.length,
          length: trimmed.length,
        });
        currentIndex += para.length + 2;
        continue;
      }

      // 如果段落过长，按句子分割
      if (trimmed.length > maxLength) {
        const subSegments = this.splitLongParagraph(
          trimmed,
          currentIndex,
          { minLength, maxLength, preferredLength }
        );
        segments.push(...subSegments);
        currentIndex += para.length + 2;
        continue;
      }

      // 如果段落过短，暂存等待与后续段落合并
      segments.push({
        text: trimmed,
        startIndex: currentIndex,
        endIndex: currentIndex + trimmed.length,
        length: trimmed.length,
      });
      currentIndex += para.length + 2;
    }

    // 合并过短的段落
    return this.mergeShortSegments(segments, config);
  }

  private splitLongParagraph(
    text: string,
    startIndex: number,
    config: { minLength: number; maxLength: number; preferredLength: number }
  ): Segment[] {
    const segments: Segment[] = [];
    const sentences = text.split(/([。！？!?]+[\s\n]*)/g).filter((s) => s.trim());

    let currentText = "";
    let currentStart = startIndex;

    for (const sentence of sentences) {
      if (currentText === "") {
        currentStart = startIndex;
      }

      const potentialLength = currentText.length + sentence.length;

      // 判断是否应该分段
      if (
        potentialLength > config.maxLength ||
        (currentText.length >= config.preferredLength &&
          potentialLength > config.preferredLength * 1.2)
      ) {
        if (currentText.trim()) {
          segments.push({
            text: currentText.trim(),
            startIndex: currentStart,
            endIndex: currentStart + currentText.length,
            length: currentText.trim().length,
          });
        }
        currentText = sentence;
        currentStart += currentText.length;
      } else {
        currentText += sentence;
      }
    }

    if (currentText.trim()) {
      segments.push({
        text: currentText.trim(),
        startIndex: currentStart,
        endIndex: currentStart + currentText.length,
        length: currentText.trim().length,
      });
    }

    return segments;
  }

  private mergeShortSegments(
    segments: Segment[],
    config: SegmentConfig
  ): Segment[] {
    const minLength = config.minLength || 50;
    const maxLength = config.maxLength || 500;
    const result: Segment[] = [];

    let i = 0;
    while (i < segments.length) {
      const current = segments[i];

      // 如果当前段落长度合适，直接加入结果
      if (current.length >= minLength) {
        result.push(current);
        i++;
        continue;
      }

      // 尝试与下一段合并
      if (i < segments.length - 1) {
        const next = segments[i + 1];
        const mergedLength = current.length + next.length + 2; // +2 for \n\n

        if (mergedLength <= maxLength) {
          result.push({
            text: current.text + "\n\n" + next.text,
            startIndex: current.startIndex,
            endIndex: next.endIndex,
            length: mergedLength,
          });
          i += 2;
          continue;
        }
      }

      // 尝试与上一段合并
      if (result.length > 0) {
        const prev = result[result.length - 1];
        const mergedLength = prev.length + current.length + 2;

        if (mergedLength <= maxLength) {
          result[result.length - 1] = {
            text: prev.text + "\n\n" + current.text,
            startIndex: prev.startIndex,
            endIndex: current.endIndex,
            length: mergedLength,
          };
          i++;
          continue;
        }
      }

      // 无法合并，作为独立段落（允许特例）
      result.push(current);
      i++;
    }

    return result;
  }
}

/**
 * 混合分段策略
 * 结合多种策略的优点
 */
export class MixedStrategy implements ISegmentStrategy {
  name = "mixed";

  private semanticStrategy = new SemanticStrategy();

  segment(text: string, config: SegmentConfig): Segment[] {
    // 混合策略本质上使用语义策略，但会额外考虑文本特征
    return this.semanticStrategy.segment(text, config);
  }
}

/**
 * 策略工厂
 */
export class StrategyFactory {
  static create(strategy: SegmentStrategy): ISegmentStrategy {
    switch (strategy) {
      case "double-newline":
        return new DoubleNewlineStrategy();
      case "sentence":
        return new SentenceStrategy();
      case "semantic":
        return new SemanticStrategy();
      case "mixed":
        return new MixedStrategy();
      default:
        throw new Error(`Unknown strategy: ${strategy}`);
    }
  }
}
