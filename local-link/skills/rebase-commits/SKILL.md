---
name: rebase-commits
description: |
  将零散的 commits 整合为清晰的逻辑提交，使 Git 历史更易读。
  Use when: (1) 用户说 "rebase commits"、"整理提交历史"、"让历史更干净"
  (2) 用户想将多个相关 commits 合并为逻辑单元
  (3) 完成一个功能后需要清理 commit 历史
  (4) 提交历史混乱，需要重新组织
---

# Rebase Commits

将零散的 commits 整合为清晰的逻辑提交。自动识别 commit 分组模式，生成 rebase 脚本，批量修改 commit message。

## Workflow

### Step 1: 分析 Commit 历史

获取需要 rebase 的 commit 范围：

```bash
# 查看 commit 历史
git log --oneline <start-commit>..HEAD

# 统计数量
git rev-list --count <start-commit>..HEAD
```

### Step 2: 识别分组模式

根据 commit message 和文件变更识别分组策略：

| 模式 | 识别特征 | 分组策略 |
|------|----------|----------|
| 功能分组 | 相同功能/模块的变更 | 每个功能合并为 1 个 commit |
| 类型分组 | `docs:`、`feat:`、`fix:`、`chore:` | 按类型和逻辑合并 |
| 目录分组 | 相同目录的文件变更 | 按模块合并 |
| 工作流分组 | `docs(phase-01)`、`feat(plan-01)` | 按阶段/计划合并 |

### Step 3: 生成分组方案

向用户展示建议的分组方案：

```
建议将 N 个 commits 合并为 M 个逻辑提交：

1. init: 项目初始化与基础配置
   - 包含: chore: add config, docs: readme...

2. feat: 实现核心功能 A
   - 包含: feat: add component, fix: bug fix...

3. feat: 实现核心功能 B
   - 包含: feat: add service, test: add tests...

确认此方案？或需要调整？
```

### Step 4: 创建备份分支

在执行 rebase 前创建备份：

```bash
git branch backup/<branch-name>-pre-rebase
```

### Step 5: 执行 Rebase

使用交互式 rebase：

```bash
# 启动交互式 rebase
git rebase -i <base-commit>^

# 在编辑器中调整：
# - pick: 保留 commit
# - squash/s: 合并到前一个 commit
# - fixup/f: 合并并丢弃 message
# - reword/r: 修改 message
```

### Step 6: 优化 Commit Message

确保 message 清晰描述变更：

```
<type>(<scope>): <subject>

<body>
```

### Step 7: 验证结果

```bash
# 查看新的 commit 历史
git log --oneline <base-commit>..HEAD

# 确认文件状态
git status
```

## Commit Message 规范

优化后的 message 应遵循：

```
<type>(<scope>): <subject>

类型说明：
- feat: 新功能实现
- fix: 修复问题
- docs: 文档更新
- chore: 杂项（构建、工具等）
- refactor: 重构（无功能变化）
- test: 测试相关
- style: 代码格式（不影响功能）
```

## 示例

### 转换前（零散 commits）

```
b2799237 docs: add readme
ed56958e fix: typo
2aa4a3e1 feat: add login page
a0fd7b27 feat: add login api
e15b958e fix: login bug
...
```

### 转换后（逻辑 commits）

```
ca1036c7 docs: 添加项目文档
8f336f51 feat: 实现用户登录功能
9632bb66 feat: 实现用户注册功能
```

## 恢复备份

如果 rebase 后需要恢复：

```bash
git reset --hard backup/<branch-name>-pre-rebase
```

## 注意事项

1. **只在本地分支执行** - 已推送的共享分支不要 rebase
2. **先创建备份** - 始终保留恢复选项
3. **确认工作区干净** - rebase 前确保无未提交更改
4. **处理冲突** - 如遇冲突，解决后 `git rebase --continue`
