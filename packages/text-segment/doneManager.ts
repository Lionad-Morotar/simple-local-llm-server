import fs from "fs";
import path from "path";

const CONFIG_DIR = path.join(__dirname, ".config");
const DONE_FILE = path.join(CONFIG_DIR, "done.json");

export interface DoneRecord {
  filename: string;
  timestamp: string;
  strategy: string;
  segmentCount: number;
  qualityScore: number;
}

interface DoneData {
  completed: DoneRecord[];
  lastUpdated: string;
}

/**
 * Done 文件管理器
 */
export class DoneManager {
  private data: DoneData;

  constructor() {
    this.data = this.load();
  }

  /**
   * 加载 done.json
   */
  private load(): DoneData {
    try {
      if (fs.existsSync(DONE_FILE)) {
        const content = fs.readFileSync(DONE_FILE, "utf-8");
        return JSON.parse(content);
      }
    } catch (error) {
      console.error("读取 done.json 失败:", error);
    }

    return {
      completed: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * 保存到 done.json
   */
  private save(): void {
    try {
      if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
      }

      this.data.lastUpdated = new Date().toISOString();
      fs.writeFileSync(DONE_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (error) {
      console.error("保存 done.json 失败:", error);
    }
  }

  /**
   * 检查文件是否已完成
   */
  isDone(filename: string): boolean {
    return this.data.completed.some((record) => record.filename === filename);
  }

  /**
   * 添加已完成记录
   */
  addDone(
    filename: string,
    strategy: string,
    segmentCount: number,
    qualityScore: number
  ): void {
    if (!this.isDone(filename)) {
      this.data.completed.push({
        filename,
        timestamp: new Date().toISOString(),
        strategy,
        segmentCount,
        qualityScore,
      });
      this.save();
    }
  }

  /**
   * 移除已完成记录
   */
  removeDone(filename: string): void {
    const index = this.data.completed.findIndex(
      (record) => record.filename === filename
    );
    if (index !== -1) {
      this.data.completed.splice(index, 1);
      this.save();
    }
  }

  /**
   * 获取所有已完成记录
   */
  getDoneFiles(): DoneRecord[] {
    return [...this.data.completed];
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    total: number;
    avgQuality: number;
    avgSegments: number;
  } {
    if (this.data.completed.length === 0) {
      return { total: 0, avgQuality: 0, avgSegments: 0 };
    }

    const avgQuality =
      this.data.completed.reduce((sum, r) => sum + r.qualityScore, 0) /
      this.data.completed.length;
    const avgSegments =
      this.data.completed.reduce((sum, r) => sum + r.segmentCount, 0) /
      this.data.completed.length;

    return {
      total: this.data.completed.length,
      avgQuality: Math.round(avgQuality),
      avgSegments: Math.round(avgSegments),
    };
  }
}
