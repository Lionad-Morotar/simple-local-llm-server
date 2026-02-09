# goose-utils

把 Goose 的配置文件 `/Users/lionad/.config/goose/config.yaml` 转成同目录的 `config.json`，并支持在 macOS 上通过 LaunchAgent 监听变更后自动重新生成。

## 使用

```bash
pnpm install
bash ./packages/goose-utils/install.sh
```

## 说明

- 生成逻辑：见 [goose-mcp-json.mjs](./goose-mcp-json.mjs)
- 安装/重装 LaunchAgent：见 [install.sh](./install.sh)
- 日志：`~/Library/Logs/goose-config-watch.{out,err}.log`
