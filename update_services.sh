#!/bin/bash

# Update Services Script
# อัพเดท Gunicorn service และ deploy WebSocket support

echo "🚀 Updating Gunicorn and deploying WebSocket support..."

# 1. Backup existing services
echo "📁 Backing up existing services..."
sudo cp /etc/systemd/system/gunicorn.service /etc/systemd/system/gunicorn.service.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "No existing gunicorn.service found"
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S)

# 2. Update Gunicorn service
echo "🔧 Updating Gunicorn service..."
sudo tee /etc/systemd/system/gunicorn.service > /dev/null << 'EOF'
[Unit]
Description=gunicorn daemon
Requires=gunicorn.socket
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/food_delivery_asean_mall
# Path ถูกต้องแล้ว - venv อยู่ข้างนอก project
ExecStart=/home/ubuntu/venv/bin/gunicorn --access-logfile - --workers 3 --bind unix:/run/gunicorn.sock food_delivery_backend.wsgi:application
ExecReload=/bin/kill -s HUP $MAINPID
Restart=on-failure
RestartSec=3

# Environment variables
EnvironmentFile=/home/ubuntu/food_delivery_asean_mall/.env

# Security
NoNewPrivileges=yes
PrivateTmp=yes

[Install]
WantedBy=multi-user.target
EOF

# 3. Create Daphne service
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

# 4. Update nginx config with WebSocket support
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

# 5. Install daphne if not exists
echo "📦 Installing Daphne..."
cd /home/ubuntu/food_delivery_asean_mall
source ../venv/bin/activate
pip install daphne

# 6. Test nginx configuration
echo "🔍 Testing nginx configuration..."
sudo nginx -t

if [ $? -ne 0 ]; then
    echo "❌ Nginx configuration error!"
    exit 1
fi

# 7. Reload and restart services
echo "🚀 Reloading services..."
sudo systemctl daemon-reload

# Stop services first
sudo systemctl stop gunicorn daphne 2>/dev/null || echo "Services not running"

# Enable and start services
sudo systemctl enable gunicorn daphne
sudo systemctl start gunicorn
sudo systemctl start daphne
sudo systemctl reload nginx

# 8. Wait a moment for services to start
sleep 3

# 9. Check services status
echo "🔍 Checking services status..."
echo "=== Gunicorn Status ==="
sudo systemctl status gunicorn --no-pager -l

echo "=== Daphne Status ==="
sudo systemctl status daphne --no-pager -l

echo "=== Nginx Status ==="
sudo systemctl status nginx --no-pager -l

# 10. Check if ports are listening
echo "🔍 Checking ports..."
echo "Port 8001 (Daphne):"
sudo ss -tlnp | grep :8001 || sudo lsof -i :8001 || echo "❌ Port 8001 not listening"

echo "Gunicorn socket:"
sudo ls -la /run/gunicorn.sock || echo "❌ Gunicorn socket not found"

echo "Port 80 (Nginx):"
sudo ss -tlnp | grep :80 || sudo lsof -i :80 || echo "❌ Port 80 not listening"

# 11. Test endpoints
echo "🧪 Testing endpoints..."
echo "API Health Check:"
curl -I http://tacashop.com/api/health/ || echo "❌ API health check failed"

echo "WebSocket endpoint:"
curl -I http://tacashop.com/ws/orders/ || echo "❌ WebSocket endpoint test failed"

echo "🎉 Services update completed!"
echo ""
echo "📋 Summary:"
echo "- Gunicorn: Fixed venv path, added restart policy, environment variables"
echo "- Daphne: ASGI server running on port 8001"
echo "- Nginx: Updated with WebSocket support"
echo "- WebSocket URL: wss://tacashop.com/ws/orders/"
echo ""
echo "🔧 Manual checks:"
echo "1. Check if all services are running: sudo systemctl status gunicorn daphne nginx"
echo "2. Check logs if needed:"
echo "   - Gunicorn: sudo journalctl -u gunicorn -f"
echo "   - Daphne: sudo journalctl -u daphne -f"
echo "   - Nginx: sudo tail -f /var/log/nginx/error.log" 