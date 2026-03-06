# 操作识别模式参考

本文档列出常见的需要本地化标注的操作模式。

## 文档写入操作

### 英文模式

```regex
(?i)(write\s+(to|a|the)?|create|generate|update|output|produce|draft|compose)
```

常见变体：
- `Write to file`
- `Write a summary`
- `Create documentation`
- `Generate report`
- `Update the README`
- `Output the result`
- `Draft an email`
- `Compose a message`

### 中文模式

```regex
(撰写|编写|生成|创建|输出|编写文档|生成报告|创建文件|写出)
```

常见变体：
- `撰写文档`
- `编写说明`
- `生成报告`
- `创建文件`
- `输出内容`

## Git 操作

### Commit 相关

```regex
(?i)(commit|git\s+commit|create\s+commit|make\s+commit|提交)
```

常见变体：
- `commit the changes`
- `git commit`
- `create a commit`
- `提交代码`
- `提交更改`

### PR 相关

```regex
(?i)(pull\s+request|pr\s+(title|description)|merge\s+request)
```

常见变体：
- `create pull request`
- `PR title`
- `PR description`

## 代码注释

### 英文模式

```regex
(?i)(add\s+comments?|comment\s+(the\s+)?code|document\s+(the\s+)?code|docstring)
```

常见变体：
- `Add comments to the code`
- `Comment the function`
- `Document the code`
- `Generate docstring`

### 中文模式

```regex
(添加注释|代码注释|添加文档|注释代码)
```

## 交互输出

### 英文模式

```regex
(?i)(print|display|output|show|respond|reply|answer|tell|explain\s+to\s+user)
```

常见变体：
- `Print the result`
- `Display the output`
- `Show the user`
- `Respond with`
- `Reply to the user`
- `Explain to the user`

### 中文模式

```regex
(打印|显示|输出|展示|回复|响应|告诉|解释给)
```

## 需要排除的模式

以下操作通常**不需要**添加语言标注：

### 读取/查询操作

- `Read`、`Load`、`Fetch`、`Get`
- `读取`、`加载`、`获取`
- `Search`、`Find`、`Query`
- `搜索`、`查找`、`查询`

### 配置/设置操作

- `Set`、`Configure`、`Initialize`
- `设置`、`配置`、`初始化`

### 删除操作

- `Delete`、`Remove`、`Clean`
- `删除`、`移除`、`清理`

## 上下文关键词

有时需要结合上下文判断：

| 上下文关键词 | 建议操作 |
|------------|---------|
| `file`、`document`、`report` | 添加标注 |
| `console`、`terminal`、`log` | 通常不添加 |
| `user`、`response`、`reply` | 添加标注 |
| `internal`、`system`、`debug` | 通常不添加 |

## 正则表达式示例

### 通用匹配

```regex
# 匹配行尾添加标注的位置
^(.+?)\s*$

# 检测是否已有标注
(?i)\s*[\(（]\s*(要求|请|note|requirement)[:：]?\s*.+[)）]\s*$
```

