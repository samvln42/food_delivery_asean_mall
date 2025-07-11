#!/bin/bash

# Deploy WebSocket Support Script (HTTP Version)
# สำหรับ setup ปัจจุบันที่ใช้ HTTP และ React dev server

echo "🚀 Deploying WebSocket Support (HTTP Version)..."

# 1. Backup existing nginx config
echo "📁 Backing up existing nginx config..."
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S)

# 2. Update nginx config with WebSocket support
echo "🔧 Updating nginx config..."
sudo tee /etc/nginx/sites-available/default > /dev/null << 'EOF'
server {
    listen 80;
    server_name tacashop.com 15.165.242.203;

    client_max_body_size 100M;

    # Frontend (React dev server)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 🔥 WebSocket Support - ส่วนที่ขาดหายไป!
    location /ws/ {
        proxy_pass http://127.0.0.1:8001;  # Daphne ASGI server
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;  # สำคัญ! Frontend เป็น HTTPS
        proxy_cache_bypass $http_upgrade;
        
        # WebSocket timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Backend (Django API) - ยังคงใช้ Gunicorn
    location /api/ {
        proxy_pass http://unix:/run/gunicorn.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;  # สำคัญ! Frontend เป็น HTTPS
        proxy_set_header Origin $http_origin;
    }

    # Health check
    location = /api/health/ {
        proxy_pass http://unix:/run/gunicorn.sock;
        proxy_set_header Host localhost;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    # Static files (Django static)
    location /static/ {
        alias /home/ubuntu/food_delivery_asean_mall/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Media files (user uploads)
    location /media/ {
        alias /home/ubuntu/food_delivery_asean_mall/media/;
        expires 1y;
        add_header Cache-Control "public";
    }
}
EOF

# 3. Create Daphne systemd service
echo "🔧 Creating Daphne systemd service..."
sudo tee /etc/systemd/system/daphne.service > /dev/null << 'EOF'
[Unit]
Description=Daphne ASGI Server for Django WebSocket
After=network.target

[Service]
Type=simple
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/food_delivery_asean_mall
Environment=PATH=/home/ubuntu/food_delivery_asean_mall/venv/bin
ExecStart=/home/ubuntu/food_delivery_asean_mall/venv/bin/daphne -b 127.0.0.1 -p 8001 food_delivery_backend.asgi:application
Restart=always
RestartSec=3

# Environment variables
EnvironmentFile=/home/ubuntu/food_delivery_asean_mall/.env

[Install]
WantedBy=multi-user.target
EOF

# 4. Install daphne if not exists
echo "📦 Installing Daphne..."
cd /home/ubuntu/food_delivery_asean_mall
source venv/bin/activate
pip install daphne

# 5. Test nginx configuration
echo "🔍 Testing nginx configuration..."
sudo nginx -t

if [ $? -ne 0 ]; then
    echo "❌ Nginx configuration error!"
    exit 1
fi

# 6. Enable and start services
echo "🚀 Starting services..."
sudo systemctl daemon-reload
sudo systemctl enable daphne
sudo systemctl start daphne
sudo systemctl reload nginx

# 7. Check services status
echo "🔍 Checking services status..."
echo "=== Daphne Status ==="
sudo systemctl status daphne --no-pager -l

echo "=== Nginx Status ==="
sudo systemctl status nginx --no-pager -l

echo "=== Gunicorn Status ==="
sudo systemctl status gunicorn --no-pager -l

# 8. Check if ports are listening
echo "🔍 Checking ports..."
echo "Port 8001 (Daphne):"
sudo netstat -tlnp | grep :8001 || echo "❌ Port 8001 not listening"

echo "Port 80 (Nginx):"
sudo netstat -tlnp | grep :80 || echo "❌ Port 80 not listening"

# 9. Test WebSocket endpoint
echo "🧪 Testing WebSocket endpoint..."
curl -I http://tacashop.com/ws/orders/ || echo "❌ WebSocket endpoint test failed"

echo "🎉 WebSocket deployment completed!"
echo ""
echo "📋 Summary:"
echo "- Nginx: Updated with WebSocket support (HTTP)"
echo "- Daphne: ASGI server running on port 8001"
echo "- Gunicorn: HTTP API server (existing)"
echo "- WebSocket URL: wss://tacashop.com/ws/orders/"
echo ""
echo "🔧 Manual checks:"
echo "1. Check if Daphne is running: sudo systemctl status daphne"
echo "2. Check if port 8001 is open: sudo netstat -tlnp | grep :8001"
echo "3. Check WebSocket logs: sudo journalctl -u daphne -f"
echo "4. Check nginx logs: sudo tail -f /var/log/nginx/error.log"
echo ""
echo "🚨 Important Notes:"
echo "- Frontend connects via HTTPS (tacashop.com) but server runs HTTP"
echo "- Make sure X-Forwarded-Proto headers are correctly set"
echo "- Test WebSocket connection from browser console" 