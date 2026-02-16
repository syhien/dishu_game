# 🚀 部署指南

## 快速部署

```bash
# 1. 克隆代码
git clone https://github.com/syhien/dishu_game.git
cd dishu_game

# 2. （可选）自定义端口
cp .env.example .env
# 修改 WEB_PORT 和 SERVER_PORT（默认 8080 和 13001）

# 3. 启动服务
docker compose up -d

# 4. 查看日志
docker compose logs -f
```

## 端口说明

| 环境变量 | 默认 | 说明 |
|---------|------|------|
| `WEB_PORT` | 8080 | 前端页面，供 Caddy/Nginx 反代 |
| `SERVER_PORT` | 13001 | 后端 API，供 Caddy/Nginx 反代 |

**注意**：默认绑定 `127.0.0.1`，仅本地访问，不直接暴露到公网。

## Caddy 配置（推荐）

```caddyfile
# Caddyfile
your-domain.com {
    # 前端页面
    reverse_proxy localhost:8080
    
    # WebSocket 代理到后端
    reverse_proxy /socket.io/* localhost:13001
}
```

启动 Caddy：
```bash
caddy run --config Caddyfile
```

## Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
    }

    location /socket.io {
        proxy_pass http://127.0.0.1:13001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 防火墙配置

```bash
# 只开放 80/443 给 Caddy/Nginx
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

## 自动更新

```bash
docker compose exec watchtower --run-once
```

## 停止服务

```bash
docker compose down
```
