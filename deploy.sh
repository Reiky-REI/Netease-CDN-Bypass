#!/bin/bash

# NeteaseMusic API 部署脚本
# 使用方法: bash deploy.sh [服务器IP] [用户名]

set -e

SERVER=${1:-"192.168.1.122"}
USER=${2:-"root"}
DEPLOY_DIR="/opt/meting"

echo "=== NeteaseMusic API 部署脚本 ==="
echo "服务器: $USER@$SERVER"
echo "部署目录: $DEPLOY_DIR"
echo ""

# 1. 创建远程目录
echo "1. 创建远程目录..."
ssh $USER@$SERVER "mkdir -p $DEPLOY_DIR"

# 2. 复制文件
echo "2. 复制文件..."
scp direct.js web.js package.json .env.example $USER@$SERVER:$DEPLOY_DIR/

# 3. 安装依赖
echo "3. 安装依赖..."
ssh $USER@$SERVER "cd $DEPLOY_DIR && npm install"

# 4. 创建系统服务
echo "4. 创建系统服务..."
ssh $USER@$SERVER "cat > /etc/systemd/system/meting-api.service << 'EOF'
[Unit]
Description=NeteaseMusic API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$DEPLOY_DIR
ExecStart=/usr/bin/node direct.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF"

# 5. 启用并启动服务
echo "5. 启用并启动服务..."
ssh $USER@$SERVER "systemctl daemon-reload && systemctl enable meting-api && systemctl start meting-api"

# 6. 检查服务状态
echo "6. 检查服务状态..."
ssh $USER@$SERVER "systemctl status meting-api | head -10"

echo ""
echo "=== 部署完成 ==="
echo "API地址: http://$SERVER:3002"
echo "管理页面: http://$SERVER:3003 (需要先启动: npm run web)"
echo ""
echo "下一步："
echo "1. 配置Cookie: ssh $USER@$SERVER 'vi $DEPLOY_DIR/.env'"
echo "2. 重启服务: ssh $USER@$SERVER 'systemctl restart meting-api'"
