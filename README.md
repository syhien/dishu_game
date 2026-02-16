# 🎮 嘀咕游戏 (Dishu Game)

[![CI](https://github.com/syhien/dishu_game/actions/workflows/ci.yml/badge.svg)](https://github.com/syhien/dishu_game/actions/workflows/ci.yml)
[![Docker](https://github.com/syhien/dishu_game/actions/workflows/docker.yml/badge.svg)](https://github.com/syhien/dishu_game/actions/workflows/docker.yml)
[![Release](https://github.com/syhien/dishu_game/actions/workflows/release.yml/badge.svg)](https://github.com/syhien/dishu_game/actions/workflows/release.yml)

一个支持多人在线游戏的平台，用户可以通过浏览器随时随地与朋友一起玩游戏。

## 功能特点

- 🎯 **简单易用** - 无需注册，选择头像和昵称即可开始游戏
- 🎲 **多种游戏** - 支持五子棋等多种游戏（持续添加中）
- 👥 **多人联机** - 实时对战，低延迟同步
- 📱 **跨设备** - 支持 PC、手机、平板等各种设备
- 🐳 **易于部署** - 使用 Docker 一键部署到云服务器
- 🚀 **CI/CD** - GitHub Actions 自动构建和部署

## 技术栈

- **前端**: React + TypeScript + Vite + Zustand
- **后端**: Node.js + Express + Socket.io
- **部署**: Docker + Docker Compose + GitHub Actions

## 快速开始

### 本地开发

```bash
# 安装后端依赖
cd apps/server
npm install
npm run dev

# 安装前端依赖（新开终端）
cd apps/web
npm install
npm run dev
```

### Docker 部署

```bash
# 构建并启动所有服务
docker compose up --build -d

# 查看日志
docker compose logs -f

# 停止服务
docker compose down
```

访问 http://localhost 即可进入游戏。

### 使用预构建镜像（推荐用于生产环境）

```bash
# 使用生产环境配置
docker compose -f docker-compose.prod.yml up -d

# 或者手动拉取最新镜像
docker pull ghcr.io/syhien/dishu_game-server:latest
docker pull ghcr.io/syhien/dishu_game-web:latest
```

## GitHub Actions 工作流

| 工作流 | 说明 | 触发条件 |
|--------|------|---------|
| [CI](.github/workflows/ci.yml) | 代码检查和构建测试 | 每次 Push / PR |
| [Docker](.github/workflows/docker.yml) | 构建并推送 Docker 镜像 | Push 到 main 或发布标签 |
| [Deploy](.github/workflows/deploy.yml) | 自动部署到服务器 | 手动触发或发布标签 |
| [Release](.github/workflows/release.yml) | 创建 GitHub Release | 推送 v* 标签 |

### 启用自动部署

1. Fork 本仓库并克隆到本地
2. 在 GitHub 仓库设置 → Secrets and variables → Actions 中添加以下 Secrets：
   - `SSH_HOST`: 你的服务器 IP
   - `SSH_USER`: SSH 用户名（如 root）
   - `SSH_KEY`: SSH 私钥内容
   - `DEPLOY_PATH`: 部署路径（如 /opt/dishu_game）

3. 在仓库页面点击 Actions → 启用 Workflows

详细部署指南见 [DEPLOY.md](DEPLOY.md)

## 项目结构

```
dishu_game/
├── .github/workflows/       # GitHub Actions 配置
├── apps/
│   ├── web/                # 前端应用
│   ├── server/             # 后端服务
├── docker-compose.yml      # 开发环境配置
├── docker-compose.prod.yml # 生产环境配置
├── deploy.sh               # 一键部署脚本
├── DEPLOY.md               # 部署文档
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

## 部署到云服务器

### 方式一：使用 GitHub Actions 自动部署

推送代码后自动构建并部署到服务器。

### 方式二：手动部署

```bash
# 1. 克隆代码
git clone https://github.com/syhien/dishu_game.git
cd dishu_game

# 2. 使用脚本部署（需要配置 SSH 密钥）
./deploy.sh your-server-ip /opt/dishu_game

# 或者手动 Docker 部署
docker compose up -d
```

### 方式三：使用 Docker 镜像

```bash
# 直接使用 GitHub Container Registry 的镜像
docker run -d -p 3001:3001 ghcr.io/syhien/dishu_game-server:latest
docker run -d -p 80:80 ghcr.io/syhien/dishu_game-web:latest
```

## 环境变量

### 后端

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | 3001 | 服务端口 |
| `HOST` | 0.0.0.0 | 监听地址 |
| `REDIS_URL` | redis://redis:6379 | Redis 连接地址 |
| `NODE_ENV` | production | 运行环境 |

## 贡献

欢迎提交 Issue 和 PR！

## License

MIT
