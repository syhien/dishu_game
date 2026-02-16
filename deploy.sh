#!/bin/bash

# 嘀咕游戏一键部署脚本
# 用法: ./deploy.sh [服务器IP] [部署路径]

SERVER_IP=${1:-}
DEPLOY_PATH=${2:-/opt/dishu_game}

if [ -z "$SERVER_IP" ]; then
    echo "用法: ./deploy.sh <服务器IP> [部署路径]"
    echo "例如: ./deploy.sh 192.168.1.100 /opt/dishu_game"
    exit 1
fi

echo "🎮 开始部署嘀咕游戏到服务器 $SERVER_IP..."

# 在服务器上执行部署
ssh -o StrictHostKeyChecking=no root@$SERVER_IP << EOF
    echo "📥 拉取最新代码..."
    if [ ! -d "$DEPLOY_PATH" ]; then
        mkdir -p $DEPLOY_PATH
        cd $DEPLOY_PATH
        git clone https://github.com/syhien/dishu_game.git .
    else
        cd $DEPLOY_PATH
        git pull origin main
    fi
    
    echo "🐳 构建并启动 Docker 容器..."
    cd $DEPLOY_PATH
    docker compose down
    docker compose pull
    docker compose up -d --build
    
    echo "🧹 清理旧镜像..."
    docker system prune -f
    
    echo "✅ 部署完成！"
    echo "🌐 前端访问: http://$SERVER_IP"
    echo "🔌 后端 API: http://$SERVER_IP:3001"
EOF

echo "🎉 部署成功！"
