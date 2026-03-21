---
name: 86links-zentao
description: 自动登录 86Links 禅道系统并查看 bug 列表。当用户说"查看禅道 bug"、"看我的 bug"、"登录禅道"、"zentao bug"时触发。
---

# 86Links 禅道自动登录

这个技能用于自动登录 86Links 禅道系统并查看分配给你的 bug 列表。

## 前置条件

- Edge 浏览器已安装
- 已配置 chrome-devtools MCP 服务器
- 网络可以访问 zentao.86links.cn（需要在内网或通过 VPN）

## 使用场景

当用户需要：
- 查看禅道中分配给自己的 bug
- 登录禅道系统
- 查看待处理的 bug 列表

## 工作流程

### 1. 启动 Edge 浏览器（如果未运行）

首先尝试连接到 Edge 浏览器，如果连接失败则启动它：

```bash
# 检查是否已有 Edge 实例运行
# 如果没有，启动新的 Edge 实例
local edge_data_dir="$HOME/.config/edge"
nohup /Applications/Microsoft\ Edge.app/Contents/MacOS/Microsoft\ Edge \
   --remote-allow-origins=http://localhost:9333 \
   --remote-debugging-port=9333 \
   --user-data-dir="$edge_data_dir" > /dev/null 2>&1 &
```

等待 2-3 秒让浏览器启动完成。

### 2. 连接到浏览器

使用 chrome-devtools MCP 工具连接到浏览器：

```
mcp__tools__chrome-devtools_1mcp_list_pages
```

### 3. 导航到禅道登录页面

```
mcp__tools__chrome-devtools_1mcp_navigate_page
url: https://zentao.86links.cn/zentao/my-work-bug.html
```

注意：直接导航到 bug 列表页面，如果未登录会自动跳转到登录页。

### 4. 检查登录状态

拍摄页面快照查看当前状态（**优先使用 DOM Tree，不依赖截图**）：

```
mcp__tools__chrome-devtools_1mcp_take_snapshot
```

从返回的 DOM Tree 中检查页面标题：
- 如果标题包含"用户登录"，则需要进行登录流程
- 从 DOM Tree 中可以直接读取表单字段、按钮等元素的 uid，用于后续操作

**重要**：应该从 DOM Tree 的 accessibility tree 中识别元素，而不是依赖截图。DOM Tree 提供了更准确的元素定位和交互能力。

### 5. 登录流程

用户名和密码通常已经预填充在登录表单中。

#### 5.1 获取并识别验证码

**重要原则：优先从 DOM Tree 获取信息，而不是依赖截图。**

验证码图片位于 `.input-group-addon` 节点中。

**唯一方案：使用 Ask 工具请求用户输入**

1. **从 DOM Tree 定位验证码图片**：
   使用 `mcp__tools__chrome-devtools_1mcp_evaluate_script` 执行 JavaScript：
   ```javascript
   () => {
     const captchaImg = document.querySelector('.input-group-addon img');
     return captchaImg ? captchaImg.src : null;
   }
   ```

2. **下载验证码图片并展示给用户**：
   ```bash
   curl -s -o /tmp/captcha.png "<返回的图片URL>"
   ```

3. **使用 Read 工具读取图片**（这样用户可以在对话中看到验证码）

4. **使用 AskUserQuestion 请求用户输入**：
   ```
   AskUserQuestion
   questions: [{
     header: "验证码",
     multiSelect: false,
     question: "请查看上面的验证码图片，手动输入验证码内容：",
     options: [
       {label: "等待用户输入", description: "用户会手动输入验证码"}
     ]
   }]
   ```

5. **填写用户提供的验证码**：
   根据用户输入使用 `mcp__tools__chrome-devtools_1mcp_fill` 填写

**注意**：不要尝试自动识别验证码，验证码通常设计为防止自动化，直接请求用户输入更高效可靠。

#### 5.2 填写验证码

```
mcp__tools__chrome-devtools_1mcp_fill
uid: [验证码输入框的 uid]
value: [识别出的验证码]
```

#### 5.3 点击登录

```
mcp__tools__chrome-devtools_1mcp_click
uid: [登录按钮的 uid]
```

### 6. 查看 bug 列表

登录成功后，页面会自动跳转到 bug 列表。拍摄快照查看结果：

```
mcp__tools__chrome-devtools_1mcp_take_snapshot
```

**从 DOM Tree 中解析 bug 信息**：

1. **查找总数**：在 DOM Tree 中找到包含 "共 X 项" 的 StaticText 节点，提取数字

2. **解析表格行**：从 DOM Tree 的表格结构中提取每个 bug 的信息：
   - 在 `table` → `rowgroup` → `row` 结构中查找
   - 每个 `cell` 节点对应一个字段
   - 字段顺序通常是：复选框、ID、级别、优先级(P)、标题、产品、类型、创建者、截止日期、解决者、解决方案

3. **提取关键字段**：
   - **ID**：从第二个 cell 的 StaticText 中提取（格式：空格 + 数字）
   - **级别**：从第三个 cell 的 description 属性或子元素中提取
   - **优先级**：从第四个 cell 的 StaticText 中提取
   - **标题**：从第五个 cell 的 link 元素中提取（可点击的 bug 标题）
   - **产品**：从第六个 cell 的 link 元素中提取
   - **类型**：从第七个 cell 的 StaticText 中提取
   - **创建者**：从第八个 cell 的 StaticText 中提取

### 7. 进入 bug 详情页（可选）

如果需要查看某个 bug 的详细信息：

**从 DOM Tree 定位并点击 bug 标题**：

1. **在 bug 列表快照中找到目标 bug**
2. **定位 bug 标题链接**：
   - 在表格的第 5 列（Bug标题列）找到 link 元素
   - 该 link 的 URL 格式为 `bug-view-{id}.html`
   - 例如：`https://zentao.86links.cn/zentao/bug-view-11407.html`

3. **点击进入详情页**：
   ```
   mcp__tools__chrome-devtools_1mcp_click
   uid: [bug 标题 link 的 uid]
   ```

4. **等待页面加载并拍摄快照**：
   ```
   mcp__tools__chrome-devtools_1mcp_take_snapshot
   ```

**详情页包含的信息**：
- Bug ID 和标题
- 重现步骤（账号、前置条件、复现步骤、实际结果、期望结果）
- 历史记录
- 基本信息（所属产品、模块、计划、Bug类型、严重程度、优先级、状态等）
- Bug的一生（由谁创建、影响版本、由谁解决、解决版本等）

**从 DOM Tree 提取详情页结构化信息**：

1. **Bug ID 和标题**：
   - ID：从 `main` 区域的第二个 StaticText 节点提取（纯数字）
   - 标题：从 `main` 区域的第三个 StaticText 节点提取

2. **重现步骤部分**：
   - 查找 "重现步骤" StaticText 节点
   - 依次提取后续内容：
     - 【账号】→ 下一个 StaticText
     - 【前置条件】→ 下一个 StaticText
     - 【复现步骤】→ 后续多个 StaticText 节点（直到遇到【实际结果】）
     - 【实际结果】→ 可能包含 link 元素（图片 URL）
     - 【期望结果】→ 下一个 StaticText

3. **基本信息**：
   - 查找 "基本信息" link 节点作为锚点
   - 依次提取后续的键值对：
     - 每个字段名（如"所属产品"）是一个 StaticText
     - 对应的值是下一个元素（StaticText 或 link）
   - 常见字段：
     - 所属产品、所属模块、所属计划、Bug类型
     - 严重程度、优先级、Bug状态
     - 当前指派、截止日期
     - 由谁创建、影响版本

4. **Bug的一生**：
   - 查找 "Bug的一生" link 节点作为锚点
   - 提取字段：由谁创建、影响版本、由谁解决、解决版本、由谁关闭、最后修改

5. **历史记录**：
   - 查找 "历史记录" StaticText 节点
   - 提取后续的时间戳和操作记录
   - 每条记录格式：时间戳 + 操作人 + 操作类型 + 可选备注

6. **图片下载并本地化**：
   - 在详情页中查找所有 link 元素，URL 格式为 `file-read-{number}.png` 等图片格式
   - 将图片下载到本地 `docs/.zentao/assets/` 目录：
     ```bash
     curl -s -o docs/.zentao/assets/{number}.png "https://zentao.86links.cn/zentao/file-read-{number}.png"
     ```
   - 文档中使用相对路径引用：`![截图](./assets/{number}.png)`

**导出为 Markdown 文档**（可选）：

如果需要将 bug 信息导出为文档：

1. 确保 `docs/.zentao/assets/` 目录存在（如不存在则创建）
2. 下载详情页中所有图片到 `docs/.zentao/assets/`，文件名保留原始 ID（如 `30198.png`）
3. 创建文件：`docs/.zentao/{bug-id}.md`
4. 使用以下结构：
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

5. 确保 `docs/.zentao` 已添加到 `.gitignore`（避免提交敏感信息）

### 8. 汇报结果

向用户报告：
- 剩余 bug 总数
- 每个 bug 的关键信息（ID、标题、产品、类型、优先级等）

**汇报格式示例**：
```
ok

我看到了你的剩余 bug 列表，共有 X 个 bug：

1. **ID**: 11407
   - **级别**: 3
   - **优先级**: 3
   - **标题**: 【前台】首页-出口优选，不展示产品信息
   - **产品**: U贸通
   - **类型**: 代码错误
   - **创建者**: 张郅
```

## 注意事项

1. **验证码识别**：验证码可能比较难识别，如果第一次失败，需要重新获取验证码并重试
2. **网络要求**：必须能够访问内网（WiFi 名称以 "86Links" 开头，或通过 VPN）
3. **浏览器实例**：确保使用专门的数据目录（`~/.config/edge`）避免与日常使用的 Edge 冲突
4. **超时处理**：如果登录过程超过 10 秒仍未完成，可能需要检查网络连接

## 错误处理

- **无法连接浏览器**：检查 Edge 是否正在运行，端口 9333 是否被占用
- **验证码错误**：重新获取验证码并识别，最多重试 3 次
- **网络错误**：提示用户检查是否连接到 86Links 内网
- **登录失败**：检查用户名密码是否正确，或账户是否被锁定

## 示例输出

```
ok

我看到了你的剩余 bug 列表，共有 1 个 bug：

- **ID**: 11407
- **标题**: 【前台】首页-出口优选，不展示产品信息
- **产品**: U贸通
- **类型**: 代码错误
- **优先级**: P3
```
