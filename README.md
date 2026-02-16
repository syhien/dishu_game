# 🎮 嘀咕游戏 (Dishu Game)

[![Docker](https://github.com/syhien/dishu_game/actions/workflows/docker.yml/badge.svg)](https://github.com/syhien/dishu_game/actions/workflows/docker.yml)
[![Release](https://github.com/syhien/dishu_game/actions/workflows/release.yml/badge.svg)](https://github.com/syhien/dishu_game/actions/workflows/release.yml)

一个支持多人在线游戏的平台，用户可以通过浏览器随时随地与朋友一起玩游戏。

## 功能特点

- 🎯 **简单易用** - 无需注册，选择头像和昵称即可开始游戏
- 🎲 **多种游戏** - 支持五子棋等多种游戏（持续添加中）
- 👥 **多人联机** - 实时对战，低延迟同步
- 📱 **跨设备** - 支持 PC、手机、平板等各种设备
- 🐳 **易于部署** - Docker 一键部署，自动更新
- 🎨 **可定制** - 支持修改名称、主题色等

## 技术栈

- **前端**: React + TypeScript + Vite + Zustand
- **后端**: Node.js + Express + Socket.io
- **部署**: Docker + Docker Compose + Watchtower

## 快速开始

### 环境要求

- Docker & Docker Compose

### Docker 一键部署

```bash
# 1. 克隆代码
git clone --depth 1 https://github.com/syhien/dishu_game.git
cd dishu_game

# 2. 启动服务（无需任何配置）
docker compose up -d

# 3. 查看日志
docker compose logs -f
```

访问 http://localhost 即可进入游戏。

### 端口说明（可在 .env 中修改）

| 变量 | 默认 | 用途 |
|------|------|------|
| `WEB_PORT` | 8080 | 前端页面（供 Caddy/Nginx 反代） |
| `SERVER_PORT` | 13001 | 后端 API（供 Caddy/Nginx 反代） |

配合 Caddy/Nginx 使用，只需对外暴露 80/443。

### 自动更新

已内置 [Watchtower](https://containrrr.dev/watchtower/)，每 5 分钟自动检查并更新镜像。

```bash
# 立即更新
docker compose exec watchtower --run-once
```

## 自定义配置

（可选）复制 `.env.example` 为 `.env` 修改：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `VITE_APP_NAME` | 嘀咕游戏 | 游戏平台名称 |
| `VITE_THEME_PRIMARY` | #667eea | 主题主色 |
| `VITE_THEME_SECONDARY` | #764ba2 | 主题辅色 |

## 项目结构

```
dishu_game/
├── .github/workflows/       # GitHub Actions
├── docker-compose.yml       # Docker 编排配置
├── .env.example             # 环境变量模板
└── README.md
```

## 游戏列表

| 游戏 | 人数 | 状态 |
|------|------|------|
| 五子棋 | 2人 | ✅ 已完成 |
| 更多游戏... | - | 🚧 开发中 |

## License

MIT
