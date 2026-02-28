---
name: release-project
description: "项目版本发布流程指导，帮助用户完成版本规划、Changelog 管理、版本号升级和 Git 标签创建。Use when: (1) 用户需要发布新版本 (2) 需要创建版本发布流程 (3) 需要管理版本号和 Changelog (4) 需要自动化版本发布"
---

# Release Project

指导项目版本发布的完整流程，从版本规划到 Git 标签创建。

## 工作流程

```
┌─────────────────┐
│  1. 版本规划     │
└────────┬────────┘
         ▼
┌─────────────────┐
│  2. Changelog   │
│    整理         │
└────────┬────────┘
         ▼
┌─────────────────┐
│  3. 版本号升级   │
└────────┬────────┘
         ▼
┌─────────────────┐
│  4. Git 提交    │
│   & 标签        │
└─────────────────┘
```

## 1. 版本规划

确定版本类型（遵循 Semantic Versioning）：

| 版本类型 | 适用场景 | 版本变化示例 |
|---------|---------|-------------|
| `patch` | Bug 修复、小幅改动 | `1.0.0` → `1.0.1` |
| `minor` | 新功能（向后兼容） | `1.0.0` → `1.1.0` |
| `major` | 破坏性变更 | `1.0.0` → `2.0.0` |

## 2. Changelog 整理

遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 规范。

### 核心原则

- 更新日志是写给**人**而非机器的
- 每个版本都应该有独立的入口
- 同类改动应该分组放置
- 新版本在前，旧版本在后
- 使用 ISO 8601 日期格式：`YYYY-MM-DD`

### 标准格式

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- 新添加的功能

### Changed
- 对现有功能的变更

### Deprecated
- 已经不建议使用，即将移除的功能

### Removed
- 已经移除的功能

### Fixed
- 对 bug 的修复

### Security
- 对安全性的改进

## [1.0.0] - 2024-01-15

### Added
- 正式发布版本
```

### 变动类型说明

| 类型 | 说明 |
|-----|------|
| `Added` | 新添加的功能 |
| `Changed` | 对现有功能的变更 |
| `Deprecated` | 已经不建议使用，即将移除的功能 |
| `Removed` | 已经移除的功能 |
| `Fixed` | 对 bug 的修复 |
| `Security` | 对安全性的改进 |

### Unreleased 区块

在文档最上方维护 `## [Unreleased]` 区块：
- 记录即将发布的变更内容
- 发布新版本时，将内容移动至新版本区块
- 保持空区块（无内容时保留标题）

### YANKED 版本

对于因重大 bug 或安全原因撤下的版本：

```markdown
## [0.0.5] - 2014-12-13 [YANKED]
```

### 检查清单

- [ ] 所有变更按正确类型分类
- [ ] 日期格式为 ISO 8601（`YYYY-MM-DD`）
- [ ] 包含 `[Unreleased]` 区块
- [ ] 空类别已移除（无内容时不保留标题）
- [ ] 版本号链接到对比页面（可选）

## 3. 版本号升级

根据项目类型选择升级方式：

**单包项目**：
```bash
# 使用 npm version
npm version [patch|minor|major]

# 或使用 standard-version
npx standard-version --release-as [patch|minor|major]
```

**Monorepo 项目**：
- 使用 changesets: `npx changeset version`
- 使用 lerna: `npx lerna version [patch|minor|major]`
- 或使用包管理器的 workspaces 命令

**版本号同步**：
- 代码中的版本号（如 CLI 工具、Server 配置）
- 文档中的版本引用
- lockfile 更新

## 4. Git 提交与标签

标准发布提交：

```bash
# 提交所有变更
git add .
git commit -m "release: v<版本号>"

# 创建标签
git tag -a "v<版本号>" -m "Release v<版本号>"

# 推送
git push origin main --tags
```

## 可选：自动化脚本

根据项目需求，可创建发布脚本 `scripts/release.sh`：

**核心步骤（按需求选择）**：
1. 接收版本类型参数（patch/minor/major）
2. 检查工作区是否干净
3. 检查 Changelog 是否已更新
4. 运行测试/构建验证
5. 升级版本号
6. 同步其他文件中的版本号
7. 创建 Git commit 和 tag
8. 推送至远程

**Dry-run 模式**：
添加 `--dry-run` 参数预览变更，不实际执行。

## 常见工具选择

| 场景 | 推荐工具 |
|-----|---------|
| 简单项目 | `npm version` |
| 需要自动生成 Changelog | `standard-version` / `semantic-release` |
| Monorepo | `changesets` / `lerna` |
| 严格流程控制 | 自定义脚本 |

## 发布检查清单

- [ ] 版本类型已确定（patch/minor/major）
- [ ] Changelog 已更新（含 Unreleased 内容迁移）
- [ ] 日期格式正确（ISO 8601）
- [ ] 测试通过
- [ ] 构建成功
- [ ] 版本号已正确升级
- [ ] Git commit 已创建
- [ ] Git tag 已创建
- [ ] 已推送到远程仓库
