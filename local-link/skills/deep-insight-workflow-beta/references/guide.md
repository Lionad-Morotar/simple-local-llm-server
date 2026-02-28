# 深度分析工作流指南

## 场景速查

| 场景 | 模块组合 | 预计时间 |
|-----|---------|---------|
| 快速筛选 | search → verify | 5-8分钟 |
| 深度分析 | search → verify → critique → understand → extend | 35-55分钟 |
| 行动导向 | search → insights → framework → implementation | 25-35分钟 |

## 模块速查

### 核心模块（必用）
- `verify-sources`: 验证来源可靠性
- `expert-insights`: 提炼专家级洞见
- `construct-framework`: 构建认知框架

### 搜索模块
- `search-context`: 背景搜索（3-5个并行代理）

### 批判模块（可选）
- `weakness-scanner`: 方法论弱点扫描
- `uncover-assumptions`: 挖掘隐藏假设

### 延伸模块（可选）
- `build-timeline`: 时间线构建（可与expert-insights并行）
- `expert-questions`: 生成追问
- `implementation-blueprint`: 实施蓝图
- `multi-audience-translation`: 多受众翻译

## 依赖关系

```
verify-sources → expert-insights → construct-framework → [expert-questions/implementation]
                      ↑
              weakness-scanner
```

## 子代理使用方式

```python
# 读取指令模板
prompt_json = read(f"references/prompts/{module_name}.json")

# 派生子代理
Task(
    subagent_type="general-purpose",
    prompt=f"""
    {prompt_json["system_prompt"]}

    ## 输入资料
    {source_material}

    ## 任务
    {prompt_json["tasks"]}

    ## 输出格式
    {prompt_json["output_template"]}
    """
)
```

## 搜索代理配置示例

```yaml
# 背景搜索 - 5个并行
- query: "{domain} 历史沿革 发展背景"
- query: "{domain} 专家观点 主流认知"
- query: "{domain} 争议问题 不同观点"
- query: "2024 2025 {domain} 新趋势"
- query: "{domain} 国内外对比 经验"

# 验证搜索 - 2-3个并行
- query: "验证: {具体论断}"
- query: "{专家姓名} {机构} 资质"
- query: "{数据} 原始出处 统计口径"
```

## 检查点话术

- 验证后: "资料可靠性 [高/中/低]，是否继续深入分析？"
- 批判后: "发现 [X] 个潜在问题，是否继续？"
- 框架后: "基于 [核心结论]，确认方向正确？"

## 日志路径

所有搜索结果写入: `/tmp/deep-insight-workflow/{date}/{task}/search-log.md`
