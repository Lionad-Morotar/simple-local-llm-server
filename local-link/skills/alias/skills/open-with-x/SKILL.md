---
name: open-with-x
description: 使用指定应用打开某文件
disable-model-invocation: true
---

## Workflow

1. 从上下文提取用户需要打开的文件或路径
2. 使用对应工具或（`open -a {应用名称} {文件路径}` 模式）打开文件

## Example

用户输入：`下载 swagger-fix 到 ~/Github/Run/xxx 然后使用 /open-with-x code`
工作步骤：
  1. 使用 gh 下载 `swagger-fix` 到 `~/Github/Run/swagger-fix`
  2. `code ~/Github/Run/swagger-fix`