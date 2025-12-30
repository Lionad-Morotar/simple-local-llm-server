# Copilot Instructions

本文件为项目的 Copilot 指南（原应命名为 copilot-instructions.md）。默认交流语言为 zh-cn。

## 行为与政策

- Use 'bd' for task tracking
- 重大改动应及时修改备忘清单、本指南等文档

## 项目说明

* 一个大 monorepo，用于管理本地的 LLM 工具集与相关脚本
* 包含多个子包，位于 `packages/` 目录下
* 使用 `pnpm` 作为包管理器与工作区工具
* 主要编程语言为 TypeScript/JavaScript，部分 Shell 脚本

## 响应格式（用于对话与变更说明）

- 标题：仅在有助于理解时使用，长度 1-3 词，形如“**Title Case**”。
- 列表：使用短而聚合的要点；格式为“- 粗体关键词: 简明描述”。
- 命令与标识：使用反引号包裹命令、环境变量与代码标识，如 `pnpm`、`NODE_ENV`、`myFunction()`。
- 文件链接：引用工作区文件或具体行号时，使用 Markdown 链接（工作区相对路径；禁止使用 file:// 或 vscode://）。示例：
	- 文件： [packages/pdf2md/README.md](packages/pdf2md/README.md)
	- 行号： [src/index.ts](packages/html2md/index.ts#L10)
	- 区间： [text-processor.ts](packages/text-segment/textProcessor.ts#L25-L34)
- 数学表达：行内用 $a=b+c$，块级使用 $$E=mc^2$$（KaTeX）。
- 简洁为先：默认不超过 8-10 行；复杂任务可适度扩展并分组说明。

## 代码与改动原则

- 根因修复：尽可能定位与修复问题的根因，避免表面补丁。
- 最小改动：保持改动聚焦，避免重构无关代码或变更公共 API。
- 一致风格：遵循现有代码风格（空格/缩进/命名）；保留已有约定。
- 文档更新：若改动影响用法或行为，同步更新相关 README/USAGE。
- 版权与头部：不要新增版权或 license 头部，除非明确要求。
- 注释与命名：不添加内联冗余注释；避免单字母变量名（除非另行要求）。

## 项目与工作流约定

- 包管理与工作区：使用 pnpm 工作区；各工具位于 `packages/` 下（如 pdf2md、md2txt、text-segment、translator、split-pdf 等）。
- 语言与脚本：TypeScript/JavaScript 与 Shell 并存；开发脚本位于 `scripts/` 与各包 `test/`。
- 运行与示例（按包脚本实际定义为准）：

```bash
# 安装依赖（工作区）
pnpm install

# 运行全部包的指定脚本（若定义）
pnpm -r run dev

# 只运行某个包（示例：pdf2md，如已定义脚本）
pnpm --filter pdf2md run dev

# 运行测试（示例：split-pdf）
pnpm --filter split-pdf test
```

- 终端与平台：当前操作系统为 macOS；优先使用跨平台命令，必要时注明平台差异。
- 大改前置说明：进行批量或高影响更改前，先简述目的与预期结果。

## 测试与验证

- 就近验证：优先运行与改动最相关的包或模块测试（如 `packages/split-pdf/tests/`）。
- 范围控制：避免修复与本次改动无关的失败或遗留问题。
- 格式化：在确认正确后再进行定向格式化（单文件或子包），避免全库重排。
- 结果自检：说明变更影响面、潜在边界条件与回滚策略（如需）。

## 交流与进度更新

- 预告语：在执行一组相关操作或工具调用前，用 1-2 句说明要做什么、为何做以及预期结果。
- 进度节奏：每完成 3-5 个操作或创建/修改 >3 个文件后，简短更新一次进度（8-10 个字内）。
- 合理分组：把相关动作合并说明，避免琐碎的逐条汇报。

## 文件引用规则（对话中）

- 路径统一：使用绝对路径并以 `/` 分隔；禁止包含盘符与外部前缀。
- 行号格式：
	- 单行： [path/file.ts](path/file.ts#L10)
	- 区间： [path/file.ts](path/file.ts#L10-L12)
- 禁止：不使用逗号分隔的多区间链接；不在链接外另写行号。

## 项目常见任务建议

- 新增工具/包：在 `packages/` 下创建目录与 `package.json`，声明脚本与类型配置；在工作区根 `pnpm-workspace.yaml` 中确保包含路径。
- 处理 PDF/MD/文本：遵循各包 README 与 USAGE；优先使用已有 worker 与 pipeline；如需并发，注意资源竞争与锁（参考 `pdf2md/lockManager.ts`）。
- 细分文本：复用 `text-segment` 的策略加载与权重模块；新增策略建议先以最小可用原型验证。

## 提示与边界

- 不确定性：对于未验证的构建/运行结论，使用“据现有上下文推断/示例”表述，并提供可复制的最少命令。
- 外部依赖：尽量使用已有依赖；若需新增，优先小而稳的库，并在对应包 `package.json` 中声明。
- 性能与资源：长任务或高负载操作前给出风险与替代方案（如分批、缓存、限流）。
