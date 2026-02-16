# 🚀 部署指南

## 快速部署

```bash
# 1. 克隆代码
git clone https://github.com/syhien/dishu_game.git
cd dishu_game

# 2. 启动服务（无需配置，开箱即用）
docker compose up -d

# 3. 查看日志
docker compose logs -f
```

访问 `http://服务器IP` 即可。

## 端口说明（可在 .env 中修改）

| 端口 | 用途 | 默认值 |
|------|------|--------|
| 8080 | 前端页面 | 避免与系统 80 冲突 |
| 13001 | 后端 API + WebSocket | 避免与常用端口冲突 |

## 防火墙配置

### Linux (ufw)
```bash
# 使用默认端口
sudo ufw allow 8080/tcp
sudo ufw allow 13001/tcp
sudo ufw reload

# 或修改 .env 后使用自定义端口
# WEB_PORT=8888
# SERVER_PORT=18001
```

### 云服务器
安全组规则允许入站：
- 8080 (前端，可修改)
- 13001 (后端，可修改)

## 自动更新

```bash
# 立即更新
docker compose exec watchtower --run-once
```

## 停止服务

```bash
docker compose down
```
