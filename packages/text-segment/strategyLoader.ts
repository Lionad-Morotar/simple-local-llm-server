/**
 * 策略加载器 - 支持外部扩展策略
 */

import fs from "fs";
import path from "path";
import { Segment, SegmentConfig, ISegmentStrategy } from "./segmentStrategies";

/**
 * 外部策略接口
 * 外部 JS 文件需要导出此接口的实现
 */
export interface ExternalStrategy {
  name: string;
  description?: string;
  segment: (text: string, config: SegmentConfig) => Segment[];
}

/**
 * 策略加载器
 */
export class StrategyLoader {
  private static strategies = new Map<string, ISegmentStrategy>();
  private static loadedFiles = new Set<string>();

  /**
   * 注册内置策略
   */
  static registerBuiltinStrategy(strategy: ISegmentStrategy): void {
    this.strategies.set(strategy.name, strategy);
  }

  /**
   * 从 JS 文件加载外部策略
   * @param filePath 策略文件路径（绝对路径或相对路径）
   */
  static async loadStrategyFromFile(filePath: string): Promise<void> {
    const absolutePath = path.resolve(filePath);

    // 避免重复加载
    if (this.loadedFiles.has(absolutePath)) {
      console.log(`⏭️  策略已加载: ${filePath}`);
      return;
    }

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`策略文件不存在: ${absolutePath}`);
    }

    try {
      // 动态导入策略模块
      const module = await import(absolutePath);
      const strategy: ExternalStrategy = module.default || module;

      if (!strategy.name || typeof strategy.segment !== 'function') {
        throw new Error('策略文件必须导出 { name, segment } 对象');
      }

      // 包装为 ISegmentStrategy
      const wrappedStrategy: ISegmentStrategy = {
        name: strategy.name,
        segment: (text: string, config: SegmentConfig) => {
          return strategy.segment(text, config);
        },
      };

      this.strategies.set(strategy.name, wrappedStrategy);
      this.loadedFiles.add(absolutePath);

      console.log(`✅ 加载外部策略: ${strategy.name} (${strategy.description || '无描述'})`);
    } catch (error) {
      throw new Error(
        `加载策略失败: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 从目录加载所有策略
   * @param dirPath 策略目录路径
   */
  static async loadStrategiesFromDir(dirPath: string): Promise<void> {
    const absolutePath = path.resolve(dirPath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`策略目录不存在: ${absolutePath}`);
    }

    const files = fs.readdirSync(absolutePath);
    const jsFiles = files.filter(f => f.endsWith('.js') || f.endsWith('.mjs'));

    console.log(`📂 发现 ${jsFiles.length} 个策略文件`);

    for (const file of jsFiles) {
      const filePath = path.join(absolutePath, file);
      try {
        await this.loadStrategyFromFile(filePath);
      } catch (error) {
        console.error(
          `❌ 加载策略失败 ${file}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  /**
   * 直接注册策略对象
   * @param strategy 策略对象
   */
  static registerStrategy(strategy: ExternalStrategy | ISegmentStrategy): void {
    if ('segment' in strategy && typeof strategy.segment === 'function') {
      this.strategies.set(strategy.name, strategy as ISegmentStrategy);
      console.log(`✅ 注册策略: ${strategy.name}`);
    } else {
      throw new Error('无效的策略对象');
    }
  }

  /**
   * 获取策略
   * @param name 策略名称
   */
  static getStrategy(name: string): ISegmentStrategy | undefined {
    return this.strategies.get(name);
  }

  /**
   * 列出所有已注册的策略
   */
  static listStrategies(): string[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * 检查策略是否存在
   */
  static hasStrategy(name: string): boolean {
    return this.strategies.has(name);
  }

  /**
   * 清除所有策略
   */
  static clearAll(): void {
    this.strategies.clear();
    this.loadedFiles.clear();
  }
}
