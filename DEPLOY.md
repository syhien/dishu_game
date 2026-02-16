# 🚀 部署指南

## 快速部署

```bash
# 1. 克隆代码
git clone https://github.com/syhien/dishu_game.git
cd dishu_game

# 2. （可选）自定义配置
cp .env.example .env
vim .env

# 3. 启动服务
docker compose up -d

# 4. 查看日志
docker compose logs -f
```

访问 `http://服务器IP` 即可。

## 自动更新

已内置 Watchtower，每 5 分钟自动检查镜像更新。

如需手动立即更新：
```bash
# 方法1：使用 watchtower
docker compose exec watchtower --run-once

# 方法2：直接拉取最新镜像
docker compose pull
docker compose up -d
```

## 防火墙配置

**注意：只需开放 80/443 端口，后端服务通过 nginx 反向代理，无需直接暴露。**

### Linux (iptables/ufw)
```bash
# 仅开放 HTTP/HTTPS 端口
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

### Windows
```powershell
# 以管理员身份运行
netsh advfirewall firewall add rule name="Dishu Game HTTP" dir=in action=allow protocol=tcp localport=80
netsh advfirewall firewall add rule name="Dishu Game HTTPS" dir=in action=allow protocol=tcp localport=443
```

### 云服务器
在控制台配置安全组规则，允许入站：
- 端口 80 (HTTP)
- 端口 443 (HTTPS，如需 SSL)

## 配置 HTTPS（推荐）

### 方案一：使用 Caddy（最简单，自动 HTTPS）

```yaml
# docker-compose.yml 中添加 caddy 服务
  caddy:
    image: caddy:2-alpine
    container_name: dishu-caddy
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - dishu-network
```

```caddyfile
# Caddyfile
your-domain.com {
    reverse_proxy web:80
}
```

### 方案二：使用 Nginx + Let's Encrypt

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://web:80;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket 代理
    location /socket.io/ {
        proxy_pass http://server:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## 架构说明

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   用户浏览器   │ ──── │  Nginx/Caddy │ ──── │ 前端静态文件  │
└─────────────┘      └──────┬──────┘      └─────────────┘
                            │
                     ┌──────┴──────┐
                     │ /socket.io  │ (WebSocket 代理)
                     └──────┬──────┘
                            ▼
                     ┌─────────────┐
                     │  Node.js    │
                     │  后端服务    │
                     └─────────────┘
```

- 前端只连接同域，自动继承 HTTPS
- 后端不直接暴露，只通过反向代理访问
- WebSocket 通过 `/socket.io` 路径代理

## 查看服务状态

```bash
# 查看所有容器状态
docker compose ps

# 查看日志
docker compose logs -f

# 查看后端日志
docker compose logs -f server

# 查看前端日志
docker compose logs -f web
```

## 停止服务

```bash
docker compose down

# 同时删除数据卷
docker compose down -v
```

## 更新配置

修改 `.env` 文件后：
```bash
docker compose up -d
```
