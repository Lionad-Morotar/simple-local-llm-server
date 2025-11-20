import fs from "fs";
import path from "path";

export interface LockData {
  encryptedFiles: string[];
  timestamp?: string;
}

/**
 * 锁定文件管理器
 * 用于记录和跳过加密的 PDF 文件
 */
export class LockManager {
  private lockFilePath: string;
  private lockData: LockData;

  constructor(configDir: string) {
    this.lockFilePath = path.join(configDir, "lock.json");
    this.lockData = this.load();
  }

  /**
   * 加载锁定数据
   */
  private load(): LockData {
    try {
      if (fs.existsSync(this.lockFilePath)) {
        const content = fs.readFileSync(this.lockFilePath, "utf-8");
        return JSON.parse(content);
      }
    } catch (error) {
      console.error("读取 lock.json 失败:", error);
    }
    return { encryptedFiles: [] };
  }

  /**
   * 保存锁定数据
   */
  private save(): void {
    try {
      const dir = path.dirname(this.lockFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      this.lockData.timestamp = new Date().toISOString();
      fs.writeFileSync(
        this.lockFilePath,
        JSON.stringify(this.lockData, null, 2),
        "utf-8"
      );
    } catch (error) {
      console.error("保存 lock.json 失败:", error);
    }
  }

  /**
   * 检查文件是否已锁定（加密）
   */
  isLocked(filename: string): boolean {
    return this.lockData.encryptedFiles.includes(filename);
  }

  /**
   * 添加锁定文件
   */
  addLocked(filename: string): void {
    if (!this.lockData.encryptedFiles.includes(filename)) {
      this.lockData.encryptedFiles.push(filename);
      this.save();
    }
  }

  /**
   * 移除锁定文件
   */
  removeLocked(filename: string): void {
    const index = this.lockData.encryptedFiles.indexOf(filename);
    if (index !== -1) {
      this.lockData.encryptedFiles.splice(index, 1);
      this.save();
    }
  }

  /**
   * 获取所有锁定文件列表
   */
  getLockedFiles(): string[] {
    return [...this.lockData.encryptedFiles];
  }

  /**
   * 清空所有锁定记录
   */
  clear(): void {
    this.lockData.encryptedFiles = [];
    this.save();
  }

  /**
   * 获取锁定文件数量
   */
  getLockedCount(): number {
    return this.lockData.encryptedFiles.length;
  }
}
