import fs from "fs";
import path from "path";

const CONFIG_DIR = path.join(__dirname, ".config");
const ERROR_FILE = path.join(CONFIG_DIR, "error.json");

export interface ErrorRecord {
  filename: string;
  error: string;
  timestamp: string;
}

interface ErrorData {
  errors: ErrorRecord[];
  lastUpdated: string;
}

/**
 * 错误文件管理器
 */
export class ErrorManager {
  private data: ErrorData;

  constructor() {
    this.data = this.load();
  }

  /**
   * 加载 error.json
   */
  private load(): ErrorData {
    try {
      if (fs.existsSync(ERROR_FILE)) {
        const content = fs.readFileSync(ERROR_FILE, "utf-8");
        return JSON.parse(content);
      }
    } catch (error) {
      console.error("读取 error.json 失败:", error);
    }

    return {
      errors: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * 保存到 error.json
   */
  private save(): void {
    try {
      if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
      }

      this.data.lastUpdated = new Date().toISOString();
      fs.writeFileSync(ERROR_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (error) {
      console.error("保存 error.json 失败:", error);
    }
  }

  /**
   * 检查文件是否有错误记录
   */
  hasError(filename: string): boolean {
    return this.data.errors.some((record) => record.filename === filename);
  }

  /**
   * 添加错误记录
   */
  addError(filename: string, error: Error | string): void {
    if (!this.hasError(filename)) {
      this.data.errors.push({
        filename,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
      this.save();
    }
  }

  /**
   * 移除错误记录
   */
  removeError(filename: string): void {
    const index = this.data.errors.findIndex(
      (record) => record.filename === filename
    );
    if (index !== -1) {
      this.data.errors.splice(index, 1);
      this.save();
    }
  }

  /**
   * 获取所有错误记录
   */
  getErrors(): ErrorRecord[] {
    return [...this.data.errors];
  }

  /**
   * 清空所有错误记录
   */
  clearAll(): void {
    this.data.errors = [];
    this.save();
  }
}
