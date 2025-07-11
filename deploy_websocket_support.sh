#!/bin/bash

# Deploy WebSocket Support Script
# เพิ่ม WebSocket support โดยไม่แก้ Gunicorn ที่มีอยู่แล้ว

echo "🚀 Deploying WebSocket support..."

# 1. Backup existing nginx config
echo "📁 Backing up existing nginx config..."
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S)

# 2. Create Daphne service (WebSocket server)
echo "🔧 Creating Daphne service..."
sudo tee /etc/systemd/system/daphne.service > /dev/null << 'EOF'
[Unit]
Description=Daphne ASGI Server for Django WebSocket
After=network.target

[Service]
Type=simple
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/food_delivery_asean_mall
Environment=PATH=/home/ubuntu/venv/bin
ExecStart=/home/ubuntu/venv/bin/daphne -b 127.0.0.1 -p 8001 food_delivery_backend.asgi:application
Restart=always
RestartSec=3

# Environment variables
EnvironmentFile=/home/ubuntu/food_delivery_asean_mall/.env

[Install]
WantedBy=multi-user.target
EOF

# 3. Update nginx config - เพิ่ม WebSocket support
echo "🔧 Updating nginx config with WebSocket support..."
sudo tee /etc/nginx/sites-available/default > /dev/null << 'EOF'
server {
    listen 80;
    server_name tacashop.com 15.165.242.203;

    client_max_body_size 100M;

    # Frontend (React dev server) - เหมือนเดิม
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

    # 🔥 WebSocket Support - เพิ่มใหม่!
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

    # Backend (Django API) - เหมือนเดิม
    location /api/ {
        proxy_pass http://unix:/run/gunicorn.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;  # สำคัญ! Frontend เป็น HTTPS
        proxy_set_header Origin $http_origin;
    }

    # Health check - เหมือนเดิม
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

# 4. Install daphne if not exists
echo "📦 Installing Daphne..."
cd /home/ubuntu/food_delivery_asean_mall
source ../venv/bin/activate
pip install daphne

# 5. Test nginx configuration
echo "🔍 Testing nginx configuration..."
sudo nginx -t

if [ $? -ne 0 ]; then
    echo "❌ Nginx configuration error!"
    exit 1
fi

# 6. Reload systemd and start Daphne
echo "🚀 Starting Daphne service..."
sudo systemctl daemon-reload
sudo systemctl enable daphne
sudo systemctl start daphne
sudo systemctl reload nginx

# 7. Wait for services to start
sleep 3

# 8. Check services status
echo "🔍 Checking services status..."
echo "=== Daphne Status ==="
sudo systemctl status daphne --no-pager -l

echo "=== Nginx Status ==="
sudo systemctl status nginx --no-pager -l

echo "=== Gunicorn Status (existing) ==="
sudo systemctl status gunicorn --no-pager -l

# 9. Check if ports are listening
echo "🔍 Checking ports..."
echo "Port 8001 (Daphne):"
sudo ss -tlnp | grep :8001 || sudo lsof -i :8001 || echo "❌ Port 8001 not listening"

echo "Gunicorn socket:"
sudo ls -la /run/gunicorn.sock || echo "❌ Gunicorn socket not found"

echo "Port 80 (Nginx):"
sudo ss -tlnp | grep :80 || sudo lsof -i :80 || echo "❌ Port 80 not listening"

# 10. Test endpoints
echo "🧪 Testing endpoints..."
echo "API Health Check:"
curl -s -I http://tacashop.com/api/health/ | head -1

echo "WebSocket endpoint:"
curl -s -I http://tacashop.com/ws/orders/ | head -1

echo ""
echo "✅ WebSocket support deployment completed!"
echo ""
echo "🎯 What was added:"
echo "  - Daphne service on port 8001"
echo "  - WebSocket support in nginx (/ws/)"
echo "  - Your existing Gunicorn service remains unchanged"
echo ""
echo "🚀 Your architecture now:"
echo "  Nginx → /api/ → Gunicorn (REST API)"
echo "  Nginx → /ws/  → Daphne (WebSocket) ← NEW!"
echo "  Nginx → /     → React Dev Server"
echo ""
echo "🔧 Test WebSocket connection:"
echo "  wss://tacashop.com/ws/orders/?token=YOUR_TOKEN"
echo "" 