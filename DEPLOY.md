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

## 端口说明

| 端口 | 用途 | 必须暴露 |
|------|------|---------|
| 80 | 前端页面 | 是 |
| 3001 | 后端 API + WebSocket | 是 |

## 防火墙配置

### Linux (ufw)
```bash
sudo ufw allow 80/tcp
sudo ufw allow 3001/tcp
sudo ufw reload
```

### 云服务器
安全组规则允许入站：
- 80 (HTTP)
- 3001 (WebSocket)

## 自动更新

```bash
# 立即更新
docker compose exec watchtower --run-once
```

## 停止服务

```bash
docker compose down
```
