/**
 * 自定义策略示例
 * 
 * 这是一个外部策略文件的示例，展示如何创建自定义分段策略
 * 使用方法：
 *   CUSTOM_STRATEGY=/path/to/custom-example.js pnpm start:text-segment
 */

module.exports = {
  name: 'custom-keyword',
  description: '基于关键词的自定义分段策略',

  /**
   * 分段函数
   * @param {string} text - 待分段文本
   * @param {object} config - 配置对象
   * @param {number} config.minLength - 最小长度
   * @param {number} config.maxLength - 最大长度
   * @param {number} config.preferredLength - 首选长度
   * @returns {Array} segments - 分段结果
   */
  segment: (text, config) => {
    const segments = [];
    const { minLength = 50, maxLength = 500 } = config;

    // 自定义关键词（章节、标题等）
    const keywords = ['第', '章', '节', '条', '款'];
    
    // 按关键词分段
    const lines = text.split('\n');
    let currentSegment = '';
    let startIndex = 0;
    let currentIndex = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      
      // 检查是否包含关键词
      const hasKeyword = keywords.some(kw => trimmed.startsWith(kw));
      
      if (hasKeyword && currentSegment.length >= minLength) {
        // 保存当前段落
        segments.push({
          text: currentSegment.trim(),
          startIndex,
          endIndex: currentIndex,
          length: currentSegment.trim().length,
        });
        
        // 开始新段落
        currentSegment = line + '\n';
        startIndex = currentIndex;
      } else {
        currentSegment += line + '\n';
      }
      
      currentIndex += line.length + 1;
      
      // 防止段落过长
      if (currentSegment.length >= maxLength) {
        segments.push({
          text: currentSegment.trim(),
          startIndex,
          endIndex: currentIndex,
          length: currentSegment.trim().length,
        });
        currentSegment = '';
        startIndex = currentIndex;
      }
    }

    // 处理最后一个段落
    if (currentSegment.trim()) {
      segments.push({
        text: currentSegment.trim(),
        startIndex,
        endIndex: currentIndex,
        length: currentSegment.trim().length,
      });
    }

    return segments;
  },
};
