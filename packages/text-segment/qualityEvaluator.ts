/**
 * 文本分段质量评估器
 */

import { Segment } from "./segmentStrategies";

export interface QualityMetrics {
  // 总体评分 0-100
  overallScore: number;

  // 各项指标 0-100
  lengthScore: number; // 长度适中性
  coherenceScore: number; // 段落完整性
  balanceScore: number; // 长度均衡性
  boundaryScore: number; // 边界合理性
  formatScore: number; // 格式规范性（新增：检测换行问题）

  // 统计信息
  totalSegments: number;
  avgLength: number;
  minLength: number;
  maxLength: number;
  lengthStdDev: number; // 长度标准差

  // 问题段落
  tooShortSegments: number; // 过短段落数
  tooLongSegments: number; // 过长段落数
  poorBoundaries: number; // 边界不佳数
  poorFormatSegments: number; // 格式不佳数（新增）
}

export interface QualityConfig {
  minLength: number;
  maxLength: number;
  preferredLength: number;
}

/**
 * 质量评估器
 */
export class QualityEvaluator {
  /**
   * 评估分段质量
   */
  static evaluate(
    segments: Segment[],
    config: QualityConfig
  ): QualityMetrics {
    const lengthScore = this.evaluateLengthScore(segments, config);
    const coherenceScore = this.evaluateCoherenceScore(segments);
    const balanceScore = this.evaluateBalanceScore(segments, config);
    const boundaryScore = this.evaluateBoundaryScore(segments);
    const formatScore = this.evaluateFormatScore(segments);

    // 计算总体评分（加权平均）
    // 增加格式规范性权重 15%，其他权重调整
    const overallScore =
      lengthScore * 0.25 +
      coherenceScore * 0.25 +
      balanceScore * 0.2 +
      boundaryScore * 0.15 +
      formatScore * 0.15;

    const stats = this.calculateStatistics(segments, config);

    return {
      overallScore: Math.round(overallScore),
      lengthScore: Math.round(lengthScore),
      coherenceScore: Math.round(coherenceScore),
      balanceScore: Math.round(balanceScore),
      boundaryScore: Math.round(boundaryScore),
      formatScore: Math.round(formatScore),
      ...stats,
    };
  }

  /**
   * 评估长度适中性
   * 段落长度在合理范围内得高分
   */
  private static evaluateLengthScore(
    segments: Segment[],
    config: QualityConfig
  ): number {
    const { minLength, maxLength, preferredLength } = config;
    let totalScore = 0;

    for (const segment of segments) {
      const len = segment.length;

      if (len < minLength) {
        // 过短：线性扣分
        const ratio = len / minLength;
        totalScore += ratio * 60; // 最多60分
      } else if (len > maxLength) {
        // 过长：指数扣分
        const excess = len - maxLength;
        const penalty = Math.min(excess / 100, 1);
        totalScore += 60 * (1 - penalty); // 最多60分
      } else {
        // 在范围内：根据接近首选长度给分
        const distance = Math.abs(len - preferredLength);
        const maxDistance = Math.max(
          preferredLength - minLength,
          maxLength - preferredLength
        );
        const ratio = 1 - distance / maxDistance;
        totalScore += 60 + ratio * 40; // 60-100分
      }
    }

    return segments.length > 0 ? totalScore / segments.length : 0;
  }

  /**
   * 评估段落完整性
   * 检查段落是否在自然断点处分割
   */
  private static evaluateCoherenceScore(segments: Segment[]): number {
    let totalScore = 0;

    for (const segment of segments) {
      const text = segment.text;
      let score = 70; // 基础分

      // 检查开头是否合理
      const startsWell =
        /^[A-Z\u4e00-\u9fa5]/.test(text) || // 大写字母或汉字开头
        /^["'「『]/.test(text) || // 引号开头
        /^\d+[.、]/.test(text); // 数字列表开头

      if (startsWell) score += 10;

      // 检查结尾是否合理
      const endsWell =
        /[。！？.!?]$/.test(text) || // 句号结尾
        /[」』"]$/.test(text) || // 引号结尾
        text.endsWith('\n'); // 换行结尾

      if (endsWell) score += 10;

      // 检查是否包含完整句子
      const sentenceCount = (text.match(/[。！？.!?]+/g) || []).length;
      if (sentenceCount >= 1) score += 5;
      if (sentenceCount >= 2) score += 5;

      totalScore += score;
    }

    return segments.length > 0 ? totalScore / segments.length : 0;
  }

  /**
   * 评估长度均衡性
   * 段落长度分布越均匀得分越高
   */
  private static evaluateBalanceScore(
    segments: Segment[],
    _config: QualityConfig
  ): number {
    if (segments.length === 0) return 0;

    const lengths = segments.map((s) => s.length);
    const avgLength =
      lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance =
      lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) /
      lengths.length;
    const stdDev = Math.sqrt(variance);

    // 计算变异系数（标准差/均值）
    const cv = stdDev / avgLength;

    // CV越小，分布越均匀，得分越高
    // CV < 0.3: 90-100分（很均匀）
    // CV < 0.5: 70-90分（较均匀）
    // CV < 0.8: 50-70分（一般）
    // CV >= 0.8: 0-50分（不均匀）

    let score: number;
    if (cv < 0.3) {
      score = 90 + (0.3 - cv) / 0.3 * 10;
    } else if (cv < 0.5) {
      score = 70 + (0.5 - cv) / 0.2 * 20;
    } else if (cv < 0.8) {
      score = 50 + (0.8 - cv) / 0.3 * 20;
    } else {
      score = Math.max(0, 50 - (cv - 0.8) * 50);
    }

    return score;
  }

  /**
   * 评估边界合理性
   * 检查分段边界是否在自然断点
   */
  private static evaluateBoundaryScore(segments: Segment[]): number {
    if (segments.length <= 1) return 100;

    let totalScore = 0;

    for (let i = 0; i < segments.length - 1; i++) {
      const current = segments[i];
      const next = segments[i + 1];

      let score = 50; // 基础分

      // 检查当前段落结尾
      const currentEndsWell =
        /[。！？.!?]$/.test(current.text) || // 句号结尾
        /[」』"]$/.test(current.text) || // 引号结尾
        /\n+$/.test(current.text); // 换行结尾

      if (currentEndsWell) score += 25;

      // 检查下一段落开头
      const nextStartsWell =
        /^[A-Z\u4e00-\u9fa5]/.test(next.text) || // 大写字母或汉字开头
        /^["'「『]/.test(next.text) || // 引号开头
        /^\d+[.、]/.test(next.text) || // 数字列表开头
        /^\s*\n/.test(next.text); // 换行开头

      if (nextStartsWell) score += 25;

      totalScore += score;
    }

    return totalScore / (segments.length - 1);
  }

  /**
   * 评估格式规范性（新增）
   * 检测段落中的换行问题，降低包含过多换行的段落评分
   */
  private static evaluateFormatScore(segments: Segment[]): number {
    if (segments.length === 0) return 100;

    let totalScore = 0;

    for (const segment of segments) {
      const text = segment.text;
      let score = 100; // 基础满分

      // 检测单换行 \n（文本中间不应该有单独的换行）
      const singleNewlines = (text.match(/[^\n]\n[^\n]/g) || []).length;
      if (singleNewlines > 0) {
        // 每个单换行扣 10 分
        score -= Math.min(singleNewlines * 10, 40);
      }

      // 检测多换行 \n\n（段落内不应该有双换行或更多）
      const multipleNewlines = (text.match(/\n\n+/g) || []).length;
      if (multipleNewlines > 0) {
        // 每个多换行扣 15 分（比单换行惩罚更重）
        score -= Math.min(multipleNewlines * 15, 50);
      }

      // 检测行首/行尾的多余空白
      const lines = text.split('\n');
      let irregularWhitespace = 0;
      for (const line of lines) {
        if (line.length > 0) {
          // 行首有多余空格（超过2个）
          if (/^\s{3,}/.test(line)) irregularWhitespace++;
          // 行尾有空格
          if (/\s+$/.test(line)) irregularWhitespace++;
        }
      }
      if (irregularWhitespace > 0) {
        score -= Math.min(irregularWhitespace * 5, 20);
      }

      // 检测换行密度（换行数/文本长度）
      const newlineCount = (text.match(/\n/g) || []).length;
      const newlineDensity = newlineCount / text.length;
      
      if (newlineDensity > 0.05) {
        // 换行密度超过 5%（每20个字符一个换行），大幅扣分
        const excessDensity = newlineDensity - 0.05;
        score -= Math.min(excessDensity * 300, 30);
      }

      totalScore += Math.max(score, 0); // 确保不低于0分
    }

    return totalScore / segments.length;
  }

  /**
   * 计算统计信息
   */
  private static calculateStatistics(
    segments: Segment[],
    config: QualityConfig
  ): {
    totalSegments: number;
    avgLength: number;
    minLength: number;
    maxLength: number;
    lengthStdDev: number;
    tooShortSegments: number;
    tooLongSegments: number;
    poorBoundaries: number;
    poorFormatSegments: number;
  } {
    if (segments.length === 0) {
      return {
        totalSegments: 0,
        avgLength: 0,
        minLength: 0,
        maxLength: 0,
        lengthStdDev: 0,
        tooShortSegments: 0,
        tooLongSegments: 0,
        poorBoundaries: 0,
        poorFormatSegments: 0,
      };
    }

    const lengths = segments.map((s) => s.length);
    const avgLength =
      lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance =
      lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) /
      lengths.length;
    const stdDev = Math.sqrt(variance);

    const tooShortSegments = segments.filter(
      (s) => s.length < config.minLength
    ).length;
    const tooLongSegments = segments.filter(
      (s) => s.length > config.maxLength
    ).length;

    // 统计边界不佳的段落
    let poorBoundaries = 0;
    for (let i = 0; i < segments.length - 1; i++) {
      const current = segments[i];
      const next = segments[i + 1];

      const currentEndsWell = /[。！？.!?]\s*$/.test(current.text);
      const nextStartsWell = /^[A-Z\u4e00-\u9fa5]/.test(next.text);

      if (!currentEndsWell || !nextStartsWell) {
        poorBoundaries++;
      }
    }

    // 统计格式不佳的段落（包含换行问题）
    const poorFormatSegments = segments.filter((s) => {
      const text = s.text;
      const hasSingleNewlines = /[^\n]\n[^\n]/.test(text);
      const hasMultipleNewlines = /\n\n+/.test(text);
      const newlineCount = (text.match(/\n/g) || []).length;
      const newlineDensity = newlineCount / text.length;
      
      return hasSingleNewlines || hasMultipleNewlines || newlineDensity > 0.05;
    }).length;

    return {
      totalSegments: segments.length,
      avgLength: Math.round(avgLength),
      minLength: Math.min(...lengths),
      maxLength: Math.max(...lengths),
      lengthStdDev: Math.round(stdDev),
      tooShortSegments,
      tooLongSegments,
      poorBoundaries,
      poorFormatSegments,
    };
  }

  /**
   * 生成质量报告
   */
  static generateReport(metrics: QualityMetrics): string {
    const lines: string[] = [];

    lines.push("📊 分段质量报告");
    lines.push("=".repeat(50));
    lines.push("");

    // 总体评分
    const grade = this.getGrade(metrics.overallScore);
    lines.push(`✨ 总体评分: ${metrics.overallScore}/100 (${grade})`);
    lines.push("");

    // 各项指标
    lines.push("📈 详细指标:");
    lines.push(`  长度适中性: ${metrics.lengthScore}/100`);
    lines.push(`  段落完整性: ${metrics.coherenceScore}/100`);
    lines.push(`  长度均衡性: ${metrics.balanceScore}/100`);
    lines.push(`  边界合理性: ${metrics.boundaryScore}/100`);
    lines.push(`  格式规范性: ${metrics.formatScore}/100`);
    lines.push("");

    // 统计信息
    lines.push("📋 统计信息:");
    lines.push(`  总段落数: ${metrics.totalSegments}`);
    lines.push(`  平均长度: ${metrics.avgLength} 字`);
    lines.push(`  长度范围: ${metrics.minLength} ~ ${metrics.maxLength} 字`);
    lines.push(`  标准差: ${metrics.lengthStdDev}`);
    lines.push("");

    // 问题段落
    if (
      metrics.tooShortSegments > 0 ||
      metrics.tooLongSegments > 0 ||
      metrics.poorBoundaries > 0 ||
      metrics.poorFormatSegments > 0
    ) {
      lines.push("⚠️  发现问题:");
      if (metrics.tooShortSegments > 0) {
        lines.push(`  过短段落: ${metrics.tooShortSegments} 个`);
      }
      if (metrics.tooLongSegments > 0) {
        lines.push(`  过长段落: ${metrics.tooLongSegments} 个`);
      }
      if (metrics.poorBoundaries > 0) {
        lines.push(`  边界不佳: ${metrics.poorBoundaries} 处`);
      }
      if (metrics.poorFormatSegments > 0) {
        lines.push(`  格式不佳: ${metrics.poorFormatSegments} 个（包含换行问题）`);
      }
      lines.push("");
    }

    // 建议
    lines.push("💡 优化建议:");
    if (metrics.lengthScore < 70) {
      lines.push("  - 调整 minLength/maxLength 参数以优化段落长度");
    }
    if (metrics.coherenceScore < 70) {
      lines.push("  - 考虑使用 'semantic' 或 'mixed' 策略提升完整性");
    }
    if (metrics.balanceScore < 70) {
      lines.push("  - 段落长度差异较大，建议调整分段策略");
    }
    if (metrics.boundaryScore < 70) {
      lines.push("  - 分段边界不够自然，尝试 'sentence' 策略");
    }
    if (metrics.formatScore < 70) {
      lines.push("  - 段落包含过多换行，建议先用 md2txt 清理文本格式");
    }
    if (metrics.overallScore >= 90) {
      lines.push("  ✅ 分段质量优秀，无需调整！");
    }

    return lines.join("\n");
  }

  /**
   * 获取评级
   */
  private static getGrade(score: number): string {
    if (score >= 98) return "S";
    if (score >= 95) return "A+";
    if (score >= 90) return "A";
    if (score >= 85) return "A-";
    if (score >= 80) return "B+";
    if (score >= 75) return "B";
    if (score >= 70) return "B-";
    if (score >= 65) return "C+";
    if (score >= 60) return "C";
    if (score >= 50) return "C-";
    return "D";
  }
}
