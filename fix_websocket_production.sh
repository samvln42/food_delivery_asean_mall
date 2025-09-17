#!/bin/bash

# 🔧 WebSocket Production Troubleshooting Script
# สคริปต์สำหรับแก้ไขปัญหา WebSocket บน production

echo "🔧 WebSocket Troubleshooting Started..."

# Function to check service status
check_service() {
    local service_name=$1
    echo "🔍 Checking $service_name status..."
    sudo systemctl is-active $service_name
    if [ $? -ne 0 ]; then
        echo "❌ $service_name is not running!"
        return 1
    else
        echo "✅ $service_name is running"
        return 0
    fi
}

# Function to restart service
restart_service() {
    local service_name=$1
    echo "🔄 Restarting $service_name..."
    sudo systemctl daemon-reload
    sudo systemctl restart $service_name
    sleep 3
    check_service $service_name
}

# 1. ตรวจสอบ Daphne service
echo "=== STEP 1: Checking Daphne Service ==="
check_service daphne
if [ $? -ne 0 ]; then
    restart_service daphne
fi

# 2. ตรวจสอบ Nginx service
echo ""
echo "=== STEP 2: Checking Nginx Service ==="
check_service nginx
if [ $? -ne 0 ]; then
    restart_service nginx
fi

# 3. ตรวจสอบ ports
echo ""
echo "=== STEP 3: Checking Ports ==="
echo "Port 8001 (Daphne ASGI):"
sudo netstat -tlnp | grep :8001
if [ $? -ne 0 ]; then
    echo "❌ Port 8001 is not listening!"
    echo "🔧 Try: sudo systemctl restart daphne"
else
    echo "✅ Port 8001 is listening"
fi

echo ""
echo "Port 8000 (Gunicorn):"
sudo netstat -tlnp | grep :8000
if [ $? -ne 0 ]; then
    echo "❌ Port 8000 is not listening!"
    echo "🔧 Try: sudo systemctl restart gunicorn"
else
    echo "✅ Port 8000 is listening"
fi

# 4. ตรวจสอบ Nginx configuration
echo ""
echo "=== STEP 4: Checking Nginx Configuration ==="
sudo nginx -t
if [ $? -ne 0 ]; then
    echo "❌ Nginx configuration has errors!"
    echo "🔧 Fix the configuration and run: sudo systemctl reload nginx"
else
    echo "✅ Nginx configuration is valid"
fi

# 5. ตรวจสอบ SSL certificate
echo ""
echo "=== STEP 5: Checking SSL Certificate ==="
if command -v certbot &> /dev/null; then
    sudo certbot certificates | grep matjyp.com
    if [ $? -ne 0 ]; then
        echo "❌ SSL certificate for matjyp.com not found!"
        echo "🔧 Try: sudo certbot --nginx -d matjyp.com"
    else
        echo "✅ SSL certificate found"
    fi
else
    echo "⚠️ Certbot not installed"
fi

# 6. ตรวจสอบ logs
echo ""
echo "=== STEP 6: Recent Logs ==="
echo "Daphne logs (last 5 lines):"
sudo journalctl -u daphne -n 5 --no-pager

echo ""
echo "Nginx error logs (last 5 lines):"
sudo tail -n 5 /var/log/nginx/error.log

# 7. ทดสอบ WebSocket connection
echo ""
echo "=== STEP 7: Testing WebSocket Connection ==="
echo "Testing HTTP upgrade to WebSocket..."
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==" -H "Sec-WebSocket-Version: 13" "https://matjyp.com/ws/orders/"

# 8. แสดงสรุปและคำแนะนำ
echo ""
echo "=== SUMMARY ==="
echo "🔧 Common fixes:"
echo "1. sudo systemctl restart daphne"
echo "2. sudo systemctl restart nginx"
echo "3. sudo systemctl reload nginx"
echo "4. sudo journalctl -u daphne -f (watch logs)"
echo ""
echo "🌐 Test WebSocket in browser:"
echo "wss://matjyp.com/ws/orders/?token=YOUR_TOKEN"
echo ""
echo "📋 Check if services are enabled on boot:"
echo "sudo systemctl is-enabled daphne"
echo "sudo systemctl is-enabled nginx"
echo ""
echo "💡 If still having issues:"
echo "1. Check firewall: sudo ufw status"
echo "2. Check DNS: nslookup matjyp.com"
echo "3. Check SSL: openssl s_client -connect matjyp.com:443"