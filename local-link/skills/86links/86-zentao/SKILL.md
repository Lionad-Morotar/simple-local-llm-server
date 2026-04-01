---
name: 86-zentao
description: 登录 86Links 禅道系统，当用户说"查看禅道 bug"、"看我的 bug"、"登录禅道"、"zentao bug"时触发。
disable-model-invocation: true
---

## 上下文

* 优先使用 DOM Tree 方法如无障碍树而不是截图来确认页面内容
* 禅道Host（`$host`）：`https://zentao.86links.cn/zentao`

## 模式匹配

### 工作流：查看我的 bug

1. 启动 Edge 浏览器（如果未运行）
2. 使用 chrome-devtools 连接到浏览器
3. 导航到禅道我的 bug 页面 `{$host}/my-work-bug.html`
   3.1 如果需要登录，使用 Ask 工具向用户请求验证码，而用户名和密码通常已经预填充在登录表单中无需过问

### 工作流：下载某个 bug（`$bug_id`）的详情

1. 进入 bug 详情页：`{$host}/bug-view-{$bug_id}.html`
2. 查找页面信息和图片，如无明显缺失则下一步
3. 保存内容：
   3.1 参考基本文档模版写：`docs/.zentao/{$bug_id}/index.md`
   3.2 将图片下载到本地 `docs/.zentao/{$bug_id}/assets/` 目录：
      ```bash
      curl -s -o docs/.zentao/assets/{number}.png "https://zentao.86links.cn/zentao/file-read-{number}.png"
      ```
      - **基本文档中使用相对路径引用**图片等资源
4. 确保 `docs/.zentao` 已添加到 `.gitignore`

## 页面内容说明

### 登录页面

* 验证码图片：`.input-group-addon img`

### 待处理 bug 页

* 总数："共 X 项" 的 StaticText 节点，提取数字
* 表格行：`table` → `rowgroup` → `row`，每个 `cell` 节点对应一个字段，字段顺序通常是：复选框、ID、级别、优先级(P)、标题、产品、类型、创建者、截止日期、解决者、解决方案
* 如需提取表格：
   - **ID**：从第二个 cell 的 StaticText 中提取（格式：空格 + 数字）
   - **级别**：从第三个 cell 的 description 属性或子元素中提取
   - **优先级**：从第四个 cell 的 StaticText 中提取
   - **标题**：从第五个 cell 的 link 元素中提取（可点击的 bug 标题）
   - **产品**：从第六个 cell 的 link 元素中提取
   - **类型**：从第七个 cell 的 StaticText 中提取
   - **创建者**：从第八个 cell 的 StaticText 中提取

### bug 详情页

* 从待处理 bug 页表格行标题点击进入 bug 详情页：`bug-view-{id}.html`
* 详情页包含：
   - Bug ID 和标题
   - 重现步骤（账号、前置条件、复现步骤、实际结果、期望结果）
   - 历史记录
   - 基本信息（所属产品、模块、计划、Bug类型、严重程度、优先级、状态等）
   - Bug的一生（由谁创建、影响版本、由谁解决、解决版本等）
* 如需提取 bug 详情：
   - ID：从 `main` 区域的第二个 StaticText 节点提取（纯数字）
   - 标题：从 `main` 区域的第三个 StaticText 节点提取
   - 重现步骤：
      - 查找 "重现步骤" StaticText 节点
      - 依次提取后续内容：
      - 【账号】→ 下一个 StaticText
      - 【前置条件】→ 下一个 StaticText
      - 【复现步骤】→ 后续多个 StaticText 节点（直到遇到【实际结果】）
      - 【实际结果】→ 可能包含 link 元素（图片 URL）
      - 【期望结果】→ 下一个 StaticText
   - 基本信息：
      - 查找 "基本信息" link 节点作为锚点
      - 依次提取后续的键值对：
      - 每个字段名（如"所属产品"）是一个 StaticText
      - 对应的值是下一个元素（StaticText 或 link）
      - 常见字段：
      - 所属产品、所属模块、所属计划、Bug类型
      - 严重程度、优先级、Bug状态
      - 当前指派、截止日期
      - 由谁创建、影响版本
   - Bug的一生
      - 查找 "Bug的一生" link 节点作为锚点
      - 提取字段：由谁创建、影响版本、由谁解决、解决版本、由谁关闭、最后修改
   - 历史记录：
      - 查找 "历史记录" StaticText 节点
      - 提取后续的时间戳和操作记录
      - 每条记录格式：时间戳 + 操作人 + 操作类型 + 可选备注
   - 图片
      - 在详情页中查找所有 link 元素，URL 格式为 `file-read-{number}.png` 等图片格式

## 基本文档模版

```markdown
# BUG #{id} {title}

**产品**: {product}
**状态**: {status}
**优先级**: P{priority}

---

## 重现步骤

### 环境
{environment}

### 账号
{account}

### 前置条件
{precondition}

### 复现步骤
{steps}

### 实际结果
![截图](./assets/{number}.png)

### 期望结果
![截图](./assets/{number}.png)

---

## 基本信息
{basic_info_list}

---

## Bug的一生
{life_info_list}

---

## 历史记录
{history_entries}
```
