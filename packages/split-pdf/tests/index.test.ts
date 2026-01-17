import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

const SCRIPT_PATH = path.resolve(__dirname, '../index.sh');
const PDF_PATH = path.resolve(__dirname, '../.pdf/2017.pdf');
const OUTPUT_DIR = path.resolve(__dirname, '../.output');

const runScript = async (args: string) => {
  try {
    // Ensure we are running from the package root context if needed, 
    // but absolute paths are used so it should be fine.
    const { stdout, stderr } = await execAsync(`bash "${SCRIPT_PATH}" ${args}`);
    return { stdout, stderr, code: 0 };
  } catch (error: any) {
    return { stdout: error.stdout, stderr: error.stderr, code: error.code || 1 };
  }
};

describe('split-pdf', () => {

  const pdfSize = fs.statSync(PDF_PATH).size / 1000 / 1000 // M
  const getChunkCount = (chunkSize: number) => Math.ceil(pdfSize / chunkSize)

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
    expect(stdout).toContain('用法:');
    expect(stdout).toContain('选项:');
  });

  it('should fail if input file does not exist', async () => {
    const { stderr, code } = await runScript('non-existent.pdf');
    expect(code).not.toBe(0);
    expect(stderr).toContain('文件不存在');
  });

  it('should validate input arguments', async () => {
    const { stderr } = await runScript(`"${PDF_PATH}" invalid`);
    expect(stderr).toContain('分割大小必须为整数');

    const { stderr: stderr2 } = await runScript(`--start 0 "${PDF_PATH}"`);
    expect(stderr2).toContain('--start 不能小于 1');
  });

  it('should dry-run split correctly', async () => {
    const { stdout, code } = await runScript(`--dry-run "${PDF_PATH}" 50`);
    expect(code).toBe(0);
    expect(stdout).toContain('Dry-run 完成');
  }, 30000);

  it('should actually split the pdf', async () => {
    const outDir = path.join(OUTPUT_DIR, 'split-real');
    // Split into 50MB chunks
    const { stdout, code } = await runScript(`-o "${outDir}" -p chunk "${PDF_PATH}" 50`);

    expect(code).toBe(0);
    expect(stdout).toContain('分割完成');

    // Check if files exist
    const files = fs.readdirSync(outDir);
    expect(files.length).toEqual(getChunkCount(50));
    expect(files.every(f => f.startsWith('chunk_'))).toBe(true); 
  }, 120000); // 2 mins for real processing

  it('should support pages splitting', async () => {
    const outDir = path.join(OUTPUT_DIR, 'split-range');
    const { code } = await runScript(`-o "${outDir}" --start 1 --end 10 "${PDF_PATH}" 1`);
    expect(code).toBe(0);
    const files = fs.readdirSync(outDir);
    expect(files.length).toBeGreaterThan(0);
  }, 60000);

  it('should handle force overwrite correctly', async () => {
    const outDir = path.join(OUTPUT_DIR, 'split-force');

    // First run
    await runScript(`-o "${outDir}" -p force "${PDF_PATH}" 100`);

    // Second run without force (should skip)
    const res1 = await runScript(`-o "${outDir}" -p force "${PDF_PATH}" 100`);
    expect(res1.stdout).toContain('跳过(已存在)');

    // Third run with force (should overwrite)
    const res2 = await runScript(`-f -o "${outDir}" -p force "${PDF_PATH}" 100`);
    expect(res2.stdout).not.toContain('跳过(已存在)');
    // Depending on implementation, it might say "生成:" or just do it.
    // The script says: "✅ 生成: ..."
    expect(res2.stdout).toContain('生成:');
  }, 120000);
});
