---
name: create-agents-md
description: 初始化项目 Agents.md
disable-model-invocation: true
---

## 上下文

* 项目根目录: `$project_root`
* gsd-docs: `$project_root/.planning/codebase/*.md`
* agents.md: `$project_root/Agents.md`
* claude.md: `$project_root/Claude.md`
* 设计上下文: `$project_root/.impeccable.md`

## 工作步骤

1. 如果不存在 agents.md 文件
  1.1 如果存在 claude.md 文件，复制其内容到 agents.md
  1.2 否则使用模版创建
2. 如果存在 claude.md 文件，删除它并 `ln -s Agents.md Claude.md`
3. 如果不存在设计上下文，但存在 `teach-impeccable` 技能，使用 Ask 工具询问用户是否执行 `teach-impeccable` 技能创建设计上下文

## Agents.md 模版

1. 如果不存在 gsd-docs，使用空内容初始化 Agents.md
2. 如果存在 gsd-docs，按照以下内容初始化 Agents.md：

```markdown
# AGENTS.md

{项目简介: 如从 package.json description 提取这是xxx项目}。

* 现实层你有无限时间和资源，不要因上下文压缩简化任务执行

## 项目上下文

| 文档                                                    | 说明                       |
| ------------------------------------------------------- | -------------------------- |
| [STACK.md](./.planning/codebase/STACK.md)               | 技术栈、开发命令、部署流程 |
| [STRUCTURE.md](./.planning/codebase/STRUCTURE.md)       | 目录结构、命名规范         |
| [ARCHITECTURE.md](./.planning/codebase/ARCHITECTURE.md) | 架构模式、术语表           |
| [CONVENTIONS.md](./.planning/codebase/CONVENTIONS.md)   | 代码风格、开发约定         |
| [TESTING.md](./.planning/codebase/TESTING.md)           | 测试规范（待建立）         |
| [INTEGRATIONS.md](./.planning/codebase/INTEGRATIONS.md) | 外部服务、环境变量         |
| [CONCERNS.md](./.planning/codebase/CONCERNS.md)         | 技术债务、注意事项         |

更新文档时优先更新到 `.planning/codebase/`。

```

如果项目存在设计上下文，文档可这样补充：

```markdown
| 文档                                                    | 说明                       |
| ------------------------------------------------------- | -------------------------- |
| [UI.md](./.impeccable.md)               | 品牌风格、设计理念、视觉方向 |
```