## Qwen 提示词示例

1. Qwen 的图像生成模型对结构化文本描述响应良好，特别是包含明确视觉层次（颜色、位置、字体样式）的提示词
2. 白板手绘风格的提示词需要详细描述手写体特征（记号笔粗细、颜色、箭头流向）以生成清晰的流程图效果
3. 文本内容在提示词中需要用引号明确包裹，避免模型解析歧义

### 示例：白板手绘风格的子代理架构图

```
一张横屏拍摄的现代办公室白板照片，冷白色调，哑光磨砂表面带细微划痕，
顶部有柔和的LED灯光反光。

顶部中央用蓝色粗体记号笔写大标题"THE RISE OF SUBAGENTS"，
其正下方用黑色细头记号笔写"基于Philschmid的博客文章（© 2025）"。

画面分为左中右三栏。

左侧区域：顶部用红色记号笔写"问题：单体代理 PROBLEM: MONOLITHIC AGENT"，
下方是一个黑色边框矩形框，框内标签写"大型代理（单体）BIG AGENT (Monolithic)"，
内部有手绘波浪线纹理，黑色手写文字列表包括"多项任务 Many Tasks"、
"巨大的上下文窗口 Huge Context Window"、"工具过多 Too Many Tools"、
"杂乱且可靠性低 CLUTTERED & LESS RELIABLE"。
红色箭头向下指向方框"上下文污染 CONTEXT POLLUTION"。
再下方用绿色记号笔写"解决方案：子代理（专业化）SOLUTION: SUBAGENTS (Specialized)"。

中央区域：顶部用黑色记号笔写"子代理架构 SUBAGENT ARCHITECTURE"。
蓝色手绘流程图从上到下：方框"用户请求 USER REQUEST"向下箭头连接至
方框"协调代理 ORCHESTRATOR AGENT"，该方框带有蓝色下划线子要点框，
内含三行黑色手写文字"分析请求 Analyzes Request"、
"分解任务 Decomposes Task"、"委派给子代理 Delegates to Subagents"。
从此处向下分出三个箭头，进入虚线框"隔离执行（聚焦上下文）ISOLATED EXECUTION (Focused Context)"，
框内有三个并排方框"子代理1 SUBAGENT 1"、"子代理2 SUBAGENT 2"、
"子代理n SUBAGENT n..."，每个方框内子要点写"自有上下文 Own Context"、
"自有工具 Own Tools"、"解决任务A/B/C Solves Task A/B/C"。
三条蓝色箭头引出汇聚到方框"协调代理（综合结果）ORCHESTRATOR AGENT (Synthesizes Results)"，
最后向下箭头连接到方框"最终答案 FINAL ANSWER"。

右侧区域分为上下两部分。
上半部分：蓝色标题"显式、用户定义的子代理 EXPLICIT, USER-DEFINED SUBAGENTS"，
流程从左"静态文件/代码 STATIC FILE / CODE"经右箭头流向右"可复用专家团队 Reusable Specialists Team"。
下方蓝色边框代码框内用等宽手写体写：
"---
name: 'Code-Reviewer'
description: 'MUST BE USED...'
tools: ['file_read', 'search_code']"。
再下方左右并列两个列表，左侧绿色写"优点 PROS:"及"完全控制 Full control"、
"可预测 Predictable"、"可复用 Reusable"；右侧红色写"缺点 CONS:"及
"僵化 Rigid"、"状态管理 State Management"、"难以扩展 Hard to Scale"。

下半部分：绿色标题"隐式、即时创建的子代理 IMPLICIT, ON-THE-FLY SUBAGENTS"，
流程从左"动态创建 DYNAMIC CREATION"经右箭头流向右"临时、任务特定 Temporary, Task-Specific"。
下方绿色边框代码框内写Python风格代码：
"# 协调代理调用工具 Orchestrator calls tool
send_message_to_agent(
    agent_name='q3_report...',
    description='...',
    message='Draft email...'
)"。
下方绿色列表写"优点 PROS:"及"灵活 Flexible"、"无需设置 No Setup"、
"多步骤上下文 Multi-step context"；红色列表写"缺点 CONS:"及
"较难预测 Less predictable"、"调试困难 Debugging difficult"。

底部区域：紫色标题"结论与要点 CONCLUSION & TAKEAWAYS"，
下方四个黑色手写要点："上下文工程就是一切！CONTEXT ENGINEERING IS EVERYTHING!"、
"专注环境 = 更佳性能、更低开销 Focused Environment = Better Performance, Lower Cost"、
"通过隔离实现可靠性 Reliability via Isolation"、
"切勿过度设计！Don't Over-engineer!"。
右下角白板托盘内放红色记号笔一支、蓝色记号笔一支、黑色板擦一块。
```

