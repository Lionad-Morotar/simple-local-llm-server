import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

const SCRIPT_PATH = path.resolve(__dirname, '../index.sh');
const PDF_PATH = path.resolve(__dirname, '../.pdf/2017.pdf');
const OUTPUT_DIR = path.resolve(__dirname, '../test-output');

const runScript = async (args: string) => {
  try {
    const { stdout, stderr } = await execAsync(`bash "${SCRIPT_PATH}" ${args}`);
    return { stdout, stderr, code: 0 };
  } catch (error: any) {
    return { stdout: error.stdout, stderr: error.stderr, code: error.code || 1 };
  }
};

describe('split-pdf', () => {
  beforeAll(() => {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(OUTPUT_DIR)) {
        fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
    }
  });

  it('should show help with -h', async () => {
    const { stdout } = await runScript('-h');
    expect(stdout).toContain('用法: split-pdf.sh');
  });

  it('should fail if input file does not exist', async () => {
    const { stderr, code } = await runScript('non-existent.pdf');
    expect(code).not.toBe(0);
    expect(stderr).toContain('文件不存在');
  });

  it('should dry-run split correctly', async () => {
    const { stdout, code } = await runScript(`--dry-run "${PDF_PATH}" 50`);
    expect(code).toBe(0);
    expect(stdout).toContain('计划:');
  }, 30000);

  it('should actually split the pdf', async () => {
    const outDir = path.join(OUTPUT_DIR, 'split-real');
    const { stdout, code } = await runScript(`-o "${outDir}" -p chunk "${PDF_PATH}" 50`);
    
    expect(code).toBe(0);
    expect(stdout).toContain('分割完成');
    
    const files = fs.readdirSync(outDir);
    expect(files.length).toBeGreaterThan(0);
    expect(files.some(f => f.startsWith('chunk_'))).toBe(true);
  }, 120000);

  it('should support sub-range splitting', async () => {
    const outDir = path.join(OUTPUT_DIR, 'split-range');
    const { stdout, code } = await runScript(`-o "${outDir}" --start 1 --end 10 "${PDF_PATH}" 10`);
    expect(code).toBe(0);
    const files = fs.readdirSync(outDir);
    expect(files.length).toBeGreaterThan(0);
  }, 60000);

  it('should handle force overwrite correctly', async () => {
     const outDir = path.join(OUTPUT_DIR, 'split-force');
     
     await runScript(`-o "${outDir}" -p force "${PDF_PATH}" 100`);
     
     const res1 = await runScript(`-o "${outDir}" -p force "${PDF_PATH}" 100`);
     expect(res1.stdout).toContain('跳过(已存在)');

     const res2 = await runScript(`-f -o "${outDir}" -p force "${PDF_PATH}" 100`);
     expect(res2.stdout).not.toContain('跳过(已存在)');
     expect(res2.stdout).toContain('生成:');
  }, 120000);

  it('should validate inputs', async () => {
      const { stderr } = await runScript(`"${PDF_PATH}" invalid`);
      expect(stderr).toContain('分割大小必须为整数');
      
      const { stderr: stderr2 } = await runScript(`--start 0 "${PDF_PATH}"`);
      expect(stderr2).toContain('--start 不能小于 1');
  });
});
