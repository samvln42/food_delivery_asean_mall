#!/bin/bash

echo "🔧 แก้ไขปัญหา 504 Gateway Timeout"
echo "=================================="

# ตรวจสอบสถานะ services
echo "📊 ตรวจสอบสถานะ services..."
sudo systemctl status gunicorn --no-pager -l
echo ""
sudo systemctl status daphne --no-pager -l
echo ""
sudo systemctl status nginx --no-pager -l
echo ""

# รีสตาร์ท services ตามลำดับ
echo "🔄 รีสตาร์ท Gunicorn service..."
sudo systemctl stop gunicorn
sudo systemctl start gunicorn
sudo systemctl status gunicorn --no-pager -l

echo ""
echo "🔄 รีสตาร์ท Daphne service..."
sudo systemctl stop daphne
sudo systemctl start daphne
sudo systemctl status daphne --no-pager -l

echo ""
echo "🔄 รีโหลด Nginx configuration..."
sudo nginx -t
if [ $? -eq 0 ]; then
    sudo systemctl reload nginx
    echo "✅ Nginx configuration reloaded successfully"
else
    echo "❌ Nginx configuration test failed"
    exit 1
fi

echo ""
echo "📋 ตรวจสอบ socket files..."
ls -la /run/gunicorn.sock
ls -la /run/daphne.sock 2>/dev/null || echo "Daphne socket not found (using TCP)"

echo ""
echo "🌐 ตรวจสอบ ports..."
sudo netstat -tlnp | grep :8001
sudo netstat -tlnp | grep gunicorn

echo ""
echo "📊 ตรวจสอบ system resources..."
echo "Memory usage:"
free -h
echo ""
echo "Disk usage:"
df -h
echo ""
echo "CPU load:"
uptime

echo ""
echo "✅ การแก้ไขเสร็จสิ้น!"
echo "🔍 หากยังมีปัญหา ให้ตรวจสอบ logs:"
echo "   sudo journalctl -u gunicorn -f"
echo "   sudo journalctl -u daphne -f"
echo "   sudo tail -f /var/log/nginx/error.log"