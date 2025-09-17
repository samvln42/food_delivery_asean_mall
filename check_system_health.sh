#!/bin/bash

echo "🏥 ตรวจสอบสุขภาพระบบ"
echo "===================="

# ตรวจสอบ services
echo "📊 Services Status:"
echo "-------------------"
services=("nginx" "gunicorn" "daphne")
for service in "${services[@]}"; do
    status=$(sudo systemctl is-active $service)
    if [ "$status" = "active" ]; then
        echo "✅ $service: $status"
    else
        echo "❌ $service: $status"
    fi
done

echo ""
echo "🔌 Network Connections:"
echo "----------------------"
echo "Gunicorn socket:"
if [ -S /run/gunicorn.sock ]; then
    echo "✅ /run/gunicorn.sock exists"
    ls -la /run/gunicorn.sock
else
    echo "❌ /run/gunicorn.sock not found"
fi

echo ""
echo "Daphne port 8001:"
if sudo netstat -tlnp | grep :8001 > /dev/null; then
    echo "✅ Port 8001 is listening"
    sudo netstat -tlnp | grep :8001
else
    echo "❌ Port 8001 is not listening"
fi

echo ""
echo "🖥️  System Resources:"
echo "--------------------"
echo "Memory:"
free -h | head -2

echo ""
echo "Disk:"
df -h | grep -E "(Filesystem|/dev/)"

echo ""
echo "Load Average:"
uptime

echo ""
echo "🔍 Recent Errors:"
echo "----------------"
echo "Gunicorn errors (last 10 lines):"
sudo journalctl -u gunicorn --no-pager -n 10 | grep -i error || echo "No recent errors"

echo ""
echo "Daphne errors (last 10 lines):"
sudo journalctl -u daphne --no-pager -n 10 | grep -i error || echo "No recent errors"

echo ""
echo "Nginx errors (last 10 lines):"
sudo tail -10 /var/log/nginx/error.log 2>/dev/null || echo "No nginx error log found"

echo ""
echo "🧪 Connection Test:"
echo "------------------"
echo "Testing local API connection:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\nTime: %{time_total}s\n" http://localhost/api/health/ 2>/dev/null || echo "Connection failed"

echo ""
echo "Testing WebSocket connection:"
if command -v wscat &> /dev/null; then
    timeout 5 wscat -c ws://localhost/ws/test/ 2>&1 || echo "WebSocket test failed or wscat not installed"
else
    echo "wscat not installed - cannot test WebSocket"
fi