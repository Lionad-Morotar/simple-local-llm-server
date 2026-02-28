---
name: deep-insight-workflow-beta
description: 资料深度分析工作流（优化版），帮助用户从上传的资料中提取深度洞见、发现矛盾、构建框架。当用户需要深度分析资料、进行尽职调查、撰写综述、提取可执行计划时触发。使用依赖驱动的模块组合和子代理并行执行，防止上下文爆炸。
---

# Deep Insight Workflow (Beta)

## 快速决策

| 用户说 | 模式 | 模块 |
|-------|------|------|
| "帮我看看"/"靠谱吗" | 快速筛选 | search → verify |
| "深度分析"/"写综述" | 深度分析 | search → verify → critique → understand → extend |
| "怎么落地"/"出方案" | 行动导向 | search → insights → framework → implementation |

## 执行流程

```
1. 匹配场景 → 确定模块组合
2. 每个模块：读取 prompts/{module}.json → 派生子代理执行
3. 并行模块同时派发
4. 检查点确认后继续
```

## 模块依赖

**强依赖**（必须先执行）：
- expert-insights ← verify-sources
- construct-framework ← expert-insights
- implementation ← framework

**可并行**：
- build-timeline + expert-insights
- weakness-scanner + uncover-assumptions

## 搜索工作流

| 搜索类型 | 时机 | 并行数 |
|---------|------|--------|
| 背景搜索 | 分析开始前 | 3-5 |
| 验证搜索 | verify-sources | 2-3 |
| 对比搜索 | expert-insights | 2-3 |

**日志路径**: `/tmp/deep-insight-workflow/{date}/{task}/search-log.md`

## 模块指令

子代理指令模板在 `references/prompts/` 目录，JSON 格式，可直接作为 system prompt 使用。

## 检查点

- 验证后："资料可靠性 [评级]，是否继续？"
- 批判后："发现 [X] 个问题，是否继续？"
- 框架后："方向确认？"

## 输出模板

```markdown
# 资料深度分析报告

## 概览
- **执行模块**：[列表]
- **资料可靠性**：[评级]
- **核心结论**：[3句话]

## 发现
[各模块输出]

## 建议
- **关键行动**：...
- **下一步**：...
```