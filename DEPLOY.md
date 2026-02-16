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

### Linux (iptables/ufw)
```bash
# 开放 80 和 3001 端口
sudo ufw allow 80/tcp
sudo ufw allow 3001/tcp
sudo ufw reload
```

### Windows
```powershell
# 以管理员身份运行
netsh advfirewall firewall add rule name="Dishu Game" dir=in action=allow protocol=tcp localport=80,3001
```

### 云服务器
在控制台配置安全组规则，允许入站：
- 端口 80 (HTTP)
- 端口 3001 (WebSocket)

## 配置 HTTPS（可选）

使用 Nginx + Let's Encrypt：

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:80;
    }

    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

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
