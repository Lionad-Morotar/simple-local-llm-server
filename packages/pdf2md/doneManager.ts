import fs from "fs";
import path from "path";

export type OCRMode = "yes" | "no" | "auto";

export interface DoneRecord {
  filename: string;
  ocrMode: OCRMode;
  convertedAt: string;
  mdPath: string;
}

export interface DoneData {
  records: DoneRecord[];
  timestamp?: string;
}

/**
 * 已完成转换管理器
 * 用于记录已成功转换的 PDF 文件及其 OCR 模式
 */
export class DoneManager {
  private doneFilePath: string;
  private doneData: DoneData;

  constructor(configDir: string) {
    this.doneFilePath = path.join(configDir, "done.json");
    this.doneData = this.load();
  }

  /**
   * 加载已完成数据
   */
  private load(): DoneData {
    try {
      if (fs.existsSync(this.doneFilePath)) {
        const content = fs.readFileSync(this.doneFilePath, "utf-8");
        return JSON.parse(content);
      }
    } catch (error) {
      console.error("读取 done.json 失败:", error);
    }
    return { records: [] };
  }

  /**
   * 保存已完成数据
   */
  private save(): void {
    try {
      const dir = path.dirname(this.doneFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      this.doneData.timestamp = new Date().toISOString();
      fs.writeFileSync(
        this.doneFilePath,
        JSON.stringify(this.doneData, null, 2),
        "utf-8"
      );
    } catch (error) {
      console.error("保存 done.json 失败:", error);
    }
  }

  /**
   * 检查文件是否已转换
   */
  isDone(filename: string): boolean {
    return this.doneData.records.some((record) => record.filename === filename);
  }

  /**
   * 获取文件的转换记录
   */
  getRecord(filename: string): DoneRecord | undefined {
    return this.doneData.records.find((record) => record.filename === filename);
  }

  /**
   * 添加已完成记录
   */
  addDone(filename: string, ocrMode: OCRMode, mdPath: string): void {
    // 移除旧记录（如果存在）
    this.removeDone(filename);

    // 添加新记录
    this.doneData.records.push({
      filename,
      ocrMode,
      convertedAt: new Date().toISOString(),
      mdPath,
    });

    this.save();
  }

  /**
   * 移除已完成记录
   */
  removeDone(filename: string): void {
    const index = this.doneData.records.findIndex(
      (record) => record.filename === filename
    );
    if (index !== -1) {
      this.doneData.records.splice(index, 1);
      this.save();
    }
  }

  /**
   * 获取所有已完成文件列表
   */
  getDoneFiles(): string[] {
    return this.doneData.records.map((record) => record.filename);
  }

  /**
   * 获取按 OCR 模式分组的统计
   */
  getStats(): {
    total: number;
    byOcrMode: Record<OCRMode, number>;
  } {
    const stats = {
      total: this.doneData.records.length,
      byOcrMode: {
        yes: 0,
        no: 0,
        auto: 0,
      } as Record<OCRMode, number>,
    };

    this.doneData.records.forEach((record) => {
      stats.byOcrMode[record.ocrMode]++;
    });

    return stats;
  }

  /**
   * 清空所有已完成记录
   */
  clear(): void {
    this.doneData.records = [];
    this.save();
  }

  /**
   * 获取已完成文件数量
   */
  getDoneCount(): number {
    return this.doneData.records.length;
  }

  /**
   * 获取所有记录
   */
  getAllRecords(): DoneRecord[] {
    return [...this.doneData.records];
  }
}
