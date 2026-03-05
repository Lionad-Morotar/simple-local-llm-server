---
name: gen-work-report
description: 生成月度工作汇报，基于 Git 提交历史自动分析并汇总工作内容。Use when user requests to generate a monthly work report, summarize work based on git commits, create work summary from commit history, or when user says "生成月报"、"工作汇报"、"月度总结"、"gen month report"、"work summary".
---

# gen-work-report

基于 Git 提交历史自动生成月度工作汇报。

## 使用方式

```
/gen-work-report <月份> [年份]
```

示例：
- `/gen-work-report 01` - 生成本年度 1 月月报
- `/gen-work-report 12 2025` - 生成 2025 年 12 月月报

## 执行步骤

### 1. 计算日期区间

```bash
YEAR=${2:-$(date +%Y)}
MONTH=$(printf "%02d" $1)
START_DATE="${YEAR}-${MONTH}-01"
END_DATE=$(date -j -v+1m -v1d -v-1d -f "%Y-%m-%d" "${START_DATE}" +%Y-%m-%d)
```

### 2. 扫描项目

遍历 `/Users/lionad/Github/86Links/` 下的 Git 仓库：

```bash
find /Users/lionad/Github/86Links -maxdepth 2 -name ".git" -type d | xargs -I {} dirname {}
```

### 3. 提取提交信息

对每个项目执行：

```bash
git log --since="START_DATE" --until="END_DATE" \
  -E --author="仿生狮子|lionad|lionad-morotar|1806234223|tangnad" \
  --pretty=format:"---COMMIT---%n%H|%an|%ad|%s" --date=short --name-only
```

结果写入 `~/tmp/project-commits/<MONTH>/<project-name>/filtered-commit-info.md`

### 4. 分析汇总

使用子代理读取所有 `filtered-commit-info.md`，从 commit message 和改动文件推断：

- **需求**：功能大方向（列表项方括号内容）
- **子需求**：具体实现点（冒号后的内容）

### 5. 生成报告

输出：`~/tmp/project-commits/<MONTH>/overview.md`

**格式模板：**

```markdown
# YYYY年M月工作月报

## 元数据

| 统计项 | 数值 |
|--------|------|
| 报告周期 | YYYY-MM-DD ~ YYYY-MM-DD |
| 活跃项目数 | X 个 |
| 总提交数 | Y 条 |
| 无改动项目 | Z 个（项目A、项目B...） |

## 项目1

- [需求A]：子需求1、子需求2、子需求3
- [需求B]：子需求1、子需求2
```

**格式规则：**
- 只包含有改动的项目
- 二级标题是项目名
- 使用列表形式：`- [需求(简短)]：子需求1、子需求2...`
- 无改动项目仅在元数据中统计列举

### 6. 格式化与打开

```bash
npx prettier --write ~/tmp/project-commits/<MONTH>/overview.md
trae ~/tmp/project-commits/<MONTH>/overview.md
```

## 边界情况

- 如果某月没有任何提交，生成仅含元数据的空报告
- 如果某个项目的 git 仓库损坏，跳过该项目并在元数据中记录警告
- 如果 `npx prettier` 失败，跳过格式化步骤，继续打开文件

## 注意事项

- 作者过滤使用正则匹配，不区分大小写
- 时间区间为闭区间（包含首尾两天）
- 只记录提交信息和文件列表，不包含具体改动内容
