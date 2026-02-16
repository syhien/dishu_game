# 🚀 部署指南

## 方式一：GitHub Actions 自动部署（推荐）

### 1. 启用 Actions

进入 GitHub 仓库页面 → **Actions** 标签 → 点击 **"I understand my workflows, go ahead and enable them"**

### 2. 配置 Secrets（可选，用于自动部署到服务器）

如果需要自动部署到自有服务器，在仓库设置中添加以下 Secrets：

| Secret 名称 | 说明 | 示例 |
|------------|------|------|
| `SSH_HOST` | 服务器 IP 地址 | `192.168.1.100` 或 `your-domain.com` |
| `SSH_USER` | SSH 用户名 | `root` |
| `SSH_KEY` | SSH 私钥 | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `DEPLOY_PATH` | 服务器上的部署路径 | `/opt/dishu_game` |

**生成 SSH 密钥对：**
```bash
ssh-keygen -t ed25519 -C "github-actions" -f github_actions_key
# 将公钥添加到服务器的 ~/.ssh/authorized_keys
cat github_actions_key.pub >> ~/.ssh/authorized_keys
# 将私钥内容复制到 GitHub Secrets 中的 SSH_KEY
```

### 3. 工作流说明

| 工作流 | 触发条件 | 功能 |
|--------|---------|------|
| `ci.yml` | 每次 push/PR | 编译测试 |
| `docker.yml` | push 标签或 main 分支 | 构建并推送 Docker 镜像到 GitHub Container Registry |
| `deploy.yml` | 手动触发或推送标签 | 部署到服务器（需配置 Secrets） |

### 4. 手动触发部署

1. 进入 GitHub 仓库 → Actions → Deploy to Server
2. 点击 **Run workflow**

---

## 方式二：手动部署

### 使用 Docker Compose（推荐）

```bash
# 1. 克隆代码
git clone https://github.com/syhien/dishu_game.git
cd dishu_game

# 2. 启动服务
docker compose up -d --build

# 3. 查看日志
docker compose logs -f
```

### 传统部署

```bash
# 后端
cd apps/server
npm install
npm run build
npm start

# 前端（新终端）
cd apps/web
npm install
npm run build
# 将 dist 文件夹部署到 Nginx 或静态托管服务
```

---

## 方式三：使用部署脚本

```bash
# 赋予执行权限
chmod +x deploy.sh

# 执行部署
./deploy.sh 192.168.1.100 /opt/dishu_game
```

---

## 🌐 云服务一键部署

### Railway
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template)

### Render
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

---

## 📋 部署后检查清单

- [ ] 防火墙开放 3000（前端）和 3001（后端）端口
- [ ] 如果是云服务器，配置安全组规则
- [ ] 配置域名（可选）
- [ ] 配置 HTTPS（使用 Nginx + Let's Encrypt）

## 🔒 生产环境建议

1. **使用反向代理**（Nginx/Caddy）
2. **启用 HTTPS**（Let's Encrypt）
3. **配置环境变量**（不要硬编码）
4. **设置日志轮转**（防止磁盘占满）
5. **配置监控报警**（Prometheus + Grafana）
