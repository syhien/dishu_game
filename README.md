# 🎮 嘀咕游戏 (Dishu Game)

[![Docker](https://github.com/syhien/dishu_game/actions/workflows/docker.yml/badge.svg)](https://github.com/syhien/dishu_game/actions/workflows/docker.yml)
[![Release](https://github.com/syhien/dishu_game/actions/workflows/release.yml/badge.svg)](https://github.com/syhien/dishu_game/actions/workflows/release.yml)

一个支持多人在线游戏的平台，用户可以通过浏览器随时随地与朋友一起玩游戏。

## 功能特点

- 🎯 **简单易用** - 无需注册，选择头像和昵称即可开始游戏
- 🎲 **多种游戏** - 支持五子棋等多种游戏（持续添加中）
- 👥 **多人联机** - 实时对战，低延迟同步
- 📱 **跨设备** - 支持 PC、手机、平板等各种设备
- 🐳 **易于部署** - Docker 一键部署，自动更新，单端口对外
- 🔒 **HTTPS 友好** - 前端同域连接，自动继承 HTTPS
- 🎨 **可定制** - 支持修改名称、主题色等

## 技术栈

- **前端**: React + TypeScript + Vite + Zustand
- **后端**: Node.js + Express + Socket.io
- **部署**: Docker + Docker Compose + Watchtower

## 快速开始

### 环境要求

- Docker & Docker Compose
- （可选）如需自定义配置，复制 `.env.example` 为 `.env`

### Docker 一键部署

```bash
# 1. 克隆代码（只包含 docker-compose.yml 和 .env）
git clone --depth 1 https://github.com/syhien/dishu_game.git
cd dishu_game

# 2. （可选）自定义配置
cp .env.example .env
# 编辑 .env 修改 VITE_APP_NAME, VITE_THEME_PRIMARY 等

# 3. 启动服务
docker compose up -d

# 4. 查看日志
docker compose logs -f
```

访问 http://localhost 即可进入游戏。

### 自动更新

已内置 [Watchtower](https://containrrr.dev/watchtower/)，每 5 分钟自动检查并更新镜像到最新版本。

如需立即更新：
```bash
docker compose exec watchtower --run-once
```

## 自定义配置

复制 `.env.example` 为 `.env`，修改以下变量：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `VITE_APP_NAME` | 嘀咕游戏 | 游戏平台名称 |
| `VITE_APP_SUBTITLE` | 在线多人游戏平台 | 副标题 |
| `VITE_APP_LOGO` | 🎮 | Logo 图标（emoji） |
| `VITE_THEME_PRIMARY` | #667eea | 主题主色 |
| `VITE_THEME_SECONDARY` | #764ba2 | 主题辅色 |
修改后重启服务生效：
```bash
docker compose up -d
```

## 项目结构

```
dishu_game/
├── .github/workflows/       # GitHub Actions（自动构建镜像）
├── docker-compose.yml       # Docker 编排配置
├── .env.example             # 环境变量模板
└── README.md
```

## 游戏列表

| 游戏 | 人数 | 状态 |
|------|------|------|
| 五子棋 | 2人 | ✅ 已完成 |
| 更多游戏... | - | 🚧 开发中 |

## 移动端适配

- 📱 支持 iOS Safari 和 Android Chrome
- 🤏 棋盘可横向滚动，适合小屏幕
- 👆 触摸优化的按钮尺寸

## GitHub Actions

| 工作流 | 说明 | 触发条件 |
|--------|------|---------|
| [Docker](.github/workflows/docker.yml) | 构建并推送 Docker 镜像 | Push 到 main 或发布标签 |
| [Release](.github/workflows/release.yml) | 创建 GitHub Release | 推送 v* 标签 |

## 架构特点

### 前后端同域部署
- 前端通过 nginx 反向代理连接后端，无需单独暴露后端端口
- WebSocket 通过 `/socket.io` 路径代理，支持 WSS
- 配置 HTTPS 时，前后端自动受益

## 环境变量

### 后端（内部使用，无需暴露到公网）

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | 3001 | 服务端口（仅容器内部使用） |
| `HOST` | 0.0.0.0 | 监听地址 |
| `REDIS_URL` | redis://redis:6379 | Redis 连接地址 |
| `NODE_ENV` | production | 运行环境 |

## 贡献

欢迎提交 Issue 和 PR！

## License

MIT
