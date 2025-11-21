/**
 * 分段策略权重配置
 *
 * 权重说明：
 * - paragraphBoundary: 段落边界（双换行）权重，优先级最高
 * - sentenceBoundary: 句子边界（句号等）权重
 * - lengthOptimization: 长度优化权重，优先级较低
 */

export interface StrategyWeights {
  paragraphBoundary: number;    // 段落边界权重（双换行）
  sentenceBoundary: number;     // 句子边界权重
  lengthOptimization: number;   // 长度优化权重
}

/**
 * 预设权重配置
 */
export const PRESET_WEIGHTS: Record<string, StrategyWeights> = {
  // 默认配置：优先段落边界
  default: {
    paragraphBoundary: 0.6,    // 60% 权重
    sentenceBoundary: 0.25,    // 25% 权重
    lengthOptimization: 0.15,  // 15% 权重
  },

  // 严格段落：强制按段落分段
  strictParagraph: {
    paragraphBoundary: 0.85,
    sentenceBoundary: 0.1,
    lengthOptimization: 0.05,
  },

  // 平衡模式：段落和句子并重
  balanced: {
    paragraphBoundary: 0.5,
    sentenceBoundary: 0.35,
    lengthOptimization: 0.15,
  },

  // 长度优先：优先考虑长度控制
  lengthFirst: {
    paragraphBoundary: 0.35,
    sentenceBoundary: 0.3,
    lengthOptimization: 0.35,
  },
};

/**
 * 获取权重配置
 */
export function getWeights(preset: string = "default"): StrategyWeights {
  return PRESET_WEIGHTS[preset] || PRESET_WEIGHTS.default;
}

/**
 * 验证权重配置（权重总和应为 1.0）
 */
export function validateWeights(weights: StrategyWeights): boolean {
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  return Math.abs(total - 1.0) < 0.001;
}

/**
 * 归一化权重（确保总和为 1.0）
 */
export function normalizeWeights(weights: Partial<StrategyWeights>): StrategyWeights {
  const defaults = PRESET_WEIGHTS.default;
  const merged = { ...defaults, ...weights };
  const total = Object.values(merged).reduce((sum, w) => sum + w, 0);
  
  if (total === 0) return defaults;
  
  return {
    paragraphBoundary: merged.paragraphBoundary / total,
    sentenceBoundary: merged.sentenceBoundary / total,
    lengthOptimization: merged.lengthOptimization / total,
  };
}
