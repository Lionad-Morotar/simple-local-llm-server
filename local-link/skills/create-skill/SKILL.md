---
name: create-skill
description: 创建新的 Claude Skill 项目，初始化 GitHub 仓库、本地 submodule 和软链接。用于将现有 skill 或新 skill 按照标准项目结构组织，支持 Git 版本管理和本地开发。使用场景：(1) 创建新的 skill 项目并推送到 GitHub (2) 将现有 skill 重构为标准项目结构 (3) 初始化 submodule 和软链接以便本地开发。
---

# Create Skill

创建新的 Claude Skill 项目，初始化 GitHub 仓库、本地 submodule 和软链接。

## 上下文

* **技能名称（skill-name）**：从上下文识别用户意图抽取变量，若识别失败则创建几个选项询问用户做选择
* **项目名称（project-name）**：`${<skill-name>}-skill`，即技能名称加后缀，但当心后缀重复

**注意**，技能名称不应当有后缀“-skill”，项目名称才需求

## 工作流程

### 1. 创建 GitHub 仓库

使用 gh-cli 创建新的 public 仓库：

```bash
gh repo create <project-name> --public --description "<description>"
```

### 2. 初始化 Submodule

在 `local-link/skills` 目录下添加 submodule：

```bash
cd /Users/lionad/G/Local/local-link/skills
git submodule add https://github.com/Lionad-Morotar/<project-name>.git <project-name>
```

**注意**：如果仓库是空的，需要先在仓库中创建初始提交（如 README.md）。

### 3. 复制现有文件（如适用）

如果 `~/.claude/skills/<skill-name>` 已存在，复制其内容到 submodule：

```bash
cp -r ~/.claude/skills/<skill-name>/* /Users/lionad/G/Local/local-link/skills/<project-name>/
```

### 4. 创建软链接

删除旧的 skill 目录，创建指向 submodule 的软链接：

```bash
# 1. backup
# 2. rm -rf ~/.claude/skills/<skill-name>
# 3. ln -s /Users/lionad/G/Local/local-link/skills/<project-name>/skills/<skill-name> ~/.claude/skills/<skill-name>
```

**注意**：软链接应指向 `skills/<skill-name>` 子目录（如果采用 translating-project 模式）。

### 5. 提交并推送

```bash
cd /Users/lionad/G/Local/local-link/skills/<project-name>
git add -A
git commit -m "Initial commit"
git push
```

## 项目结构

推荐的项目结构：

```
<project-name>/
├── README.md              # 项目说明（仿照 /Users/lionad/G/Local/local-link/skills/mcp-builder/README.md）
├── skills/
│   └── <skill-name>/      # Skill 目录
│       ├── SKILL.md       # Skill 定义
│       ├── reference/     # 参考文档（可选）
│       ├── scripts/       # 脚本（可选）
│       └── assets/        # 资源文件（可选）
```

## 检查清单

- [ ] GitHub 仓库已创建
- [ ] Submodule 路径正确（`local-link/skills/<skill-name>`）
- [ ] `.gitmodules` 中没有重复条目
- [ ] 软链接指向正确的路径
- [ ] 所有文件已提交并推送到远程

## 常见问题

### Submodule 路径错误

如果 `.gitmodules` 中有重复条目，手动清理：

```bash
# 删除错误的条目
# 编辑 .gitmodules 文件，保留正确的路径

# 清理 git config
git config --remove-section submodule.<wrong-name>
```

### 空仓库无法添加 submodule

如果仓库是空的，先创建初始提交：

```bash
git checkout -b main
echo "# <skill-name>" > README.md
git add README.md
git commit -m "Initial commit"
git push -u origin main
```
