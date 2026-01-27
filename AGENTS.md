# AGENTS.md - Agentic Coding Guidelines

本文件为项目的 Agent 指南，涵盖命令、代码风格与工作流约定。

## 基础命令

- **安装依赖**: `pnpm install`
- **工作区根脚本**: `pnpm run <script>` (见 package.json scripts)
- **运行单个包**: `pnpm --filter <package-name> run <script>`
- **运行全部包脚本**: `pnpm -r run <script>`

## 测试命令

| 包 | 命令 | 说明 |
|---|---|---|
| split-pdf | `pnpm --filter split-pdf test` | 运行 vitest |
| split-pdf 单文件 | `npx vitest packages/split-pdf/tests/index.test.ts` | 运行指定测试 |
| port-key | `npx vitest packages/port-key` | 运行 port-key vitest |
| port-key 单文件 | `npx vitest packages/port-key/packages/mcp/tests/mcp-server.test.ts` | 运行指定测试 |

```bash
# vitest 常用选项
npx vitest run              # 单次运行，不监听
npx vitest --reporter=dot   # 简洁输出
npx vitest --testTimeout=30000  # 超时设置(ms)
```

## 开发启动

```bash
# 翻译服务器
pnpm start:translate-server

# 各工具入口
pnpm start:html2md
pnpm start:pdf2md
pnpm start:pdf2md:ocr      # 启用 OCR
pnpm start:md2txt
pnpm start:text-segment
```

## 代码风格

### 格式与命名

- **文件命名**: kebab-case (如 `split-pdf`, `mcp-server.ts`)
- **类命名**: PascalCase (如 `MCPServerApp`)
- **函数/变量**: camelCase (如 `batchConvert`, `getCPUUsage`)
- **常量**: UPPER_SNAKE_CASE 或 camelCase (如 `TARGET_CPU_USAGE`)
- **字符串**: 双引号 (如 `"Starting PortKey MCP Server"`)

### Import 规范

```typescript
// Node.js 内置模块
import fs from "fs";
import { randomUUID } from "node:crypto";

// 第三方模块
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// 相对路径 (省略 .ts/.js 扩展名)
import logger from "./utils/logger.js";
import { tools } from "./tools/index.js";
```

### 类型与接口

```typescript
// 接口命名 PascalCase
interface CustomLogger extends winston.Logger {
  getLevel(): string;
  setLevel(level: string): void;
}

// 类型别名
type ChunkResult = { success: boolean; filename: string; error?: Error };

// 显式类型标注 (尤其在函数参数和返回值)
function processInWorker(htmlPath: string, mdPath: string): Promise<ChunkResult>
```

### 错误处理

```typescript
// 优先使用 try/catch，保留原始错误信息
try {
  const result = await processInWorker(htmlPath, mdPath);
} catch (error) {
  logger.error("转换失败:", error);
  addErrorFile(filename, error);
}

// 错误类型判断
const code = err && typeof err === "object" && "code" in err ? (err as any).code : undefined;
if (code === "EADDRINUSE") { ... }
```

### 日志规范

- 使用 `logger` 模块 (winston)，避免 `console.log`
- 日志级别: `info`, `error`, `warn`, `debug`
- 开发环境输出彩色格式，生产环境 JSON 格式

```typescript
logger.info(`Starting PortKey MCP Server on port ${port}`);
logger.error("Failed to start HTTP server", err);
```

### 注释规则

- **不添加冗余注释**: 代码自解释时省略注释
- **复杂逻辑**可添加中文注释说明意图
- **公开 API** 可用 JSDoc 描述

```typescript
/**
 * 动态调整 Worker 数量
 */
async function adjustWorkerCount(activeWorkers: number): Promise<number>
```

### 其他约定

- **异步函数**: 返回 `Promise<T>`，使用 `async/await`
- **模块系统**: 使用 ESM (`import`/`export default`)
- **路径分隔符**: 使用 `/` (POSIX 风格)，Node.js 会自动处理
- **魔法数字**: 提取为常量 (如 `TARGET_CPU_USAGE = 0.8`)

## 项目结构

```
packages/
  ├── split-pdf/      # Shell + TypeScript 测试
  ├── mcp-pdf/        # MCP PDF 工具
  ├── port-key/       # MCP 端口管理 (vitest + TypeScript)
  ├── pdf2md/         # PDF 转 Markdown
  ├── html2md/        # HTML 转 Markdown
  ├── md2txt/         # Markdown 提取文本
  ├── text-segment/   # 文本分词
  └── translator/     # 翻译服务
```

## 响应与变更规范

- **进度更新**: 每 3-5 个操作后简报 (8-10 字)
- **文件引用**: 使用 Markdown 链接 `[path/file.ts](path/file.ts#L10)`
- **改动原则**: 根因修复、最小改动、风格一致
