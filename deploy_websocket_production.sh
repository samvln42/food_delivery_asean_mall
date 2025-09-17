#!/bin/bash

# 🚀 Deploy WebSocket Production Script
# สคริปต์สำหรับ deploy WebSocket บน production server

echo "🚀 Starting WebSocket Production Deployment..."

# 1. อัปเดตโค้ด
echo "📦 Pulling latest code..."
git pull origin main

# 2. ติดตั้ง dependencies
echo "📚 Installing Python dependencies..."
source venv/bin/activate
pip install -r requirements.txt

# 3. Migrate database
echo "🗄️ Running database migrations..."
python manage.py migrate

# 4. Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

# 5. ตรวจสอบ Daphne service
echo "🔍 Checking Daphne service status..."
sudo systemctl status daphne

# 6. รีสตาร์ท Daphne service
echo "🔄 Restarting Daphne service..."
sudo systemctl daemon-reload
sudo systemctl enable daphne
sudo systemctl restart daphne
sleep 3

# 7. ตรวจสอบสถานะหลังรีสตาร์ท
echo "✅ Checking Daphne service after restart..."
sudo systemctl status daphne --no-pager

# 8. ตรวจสอบ logs
echo "📝 Checking Daphne logs..."
sudo journalctl -u daphne -n 10 --no-pager

# 9. อัปเดต Nginx config
echo "🌐 Updating Nginx configuration..."
sudo cp nginx_config_websocket.conf /etc/nginx/sites-available/default
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx config is valid, reloading..."
    sudo systemctl reload nginx
else
    echo "❌ Nginx config has errors!"
    exit 1
fi

# 10. ตรวจสอบ ports
echo "🔌 Checking if ports are listening..."
echo "Port 8001 (Daphne):"
sudo netstat -tlnp | grep :8001
echo "Port 8000 (Gunicorn):"
sudo netstat -tlnp | grep :8000

# 11. ทดสอบ WebSocket connection
echo "🧪 Testing WebSocket connection..."
curl -I "https://matjyp.com/ws/orders/"

echo "🎉 WebSocket deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. ตรวจสอบ SSL certificate: sudo certbot certificates"
echo "2. ทดสอบ WebSocket ใน browser: wss://matjyp.com/ws/orders/"
echo "3. ดู logs: sudo journalctl -u daphne -f"
echo ""
echo "🔧 Troubleshooting commands:"
echo "- sudo systemctl restart daphne"
echo "- sudo systemctl restart nginx"
echo "- sudo journalctl -u daphne -n 20"
echo "- sudo nginx -t"