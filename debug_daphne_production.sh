#!/bin/bash

# 🔍 Debug Daphne Production Script
# สคริปต์สำหรับ debug ปัญหา Daphne บน production server

echo "🔍 Debugging Daphne Service..."

# 1. แสดง service status
echo "=== STEP 1: Service Status ==="
sudo systemctl status daphne --no-pager

# 2. แสดง logs ล่าสุด
echo ""
echo "=== STEP 2: Recent Logs ==="
sudo journalctl -u daphne -n 10 --no-pager

# 3. ตรวจสอบ paths และ files
echo ""
echo "=== STEP 3: Path Verification ==="
echo "Current directory: $(pwd)"
echo "Virtual environment:"
ls -la /home/ubuntu/venv/bin/daphne 2>/dev/null || echo "❌ Daphne not found in venv"
echo "Working directory:"
ls -la /home/ubuntu/food_delivery_asean_mall 2>/dev/null || echo "❌ Project directory not found"

# 4. ตรวจสอบ port
echo ""
echo "=== STEP 4: Port Check ==="
echo "Port 8001:"
sudo netstat -tlnp | grep :8001 || echo "✅ Port 8001 is free"

# 5. ตรวจสอบ Python และ Django
echo ""
echo "=== STEP 5: Python/Django Check ==="
cd /home/ubuntu/food_delivery_asean_mall
source /home/ubuntu/venv/bin/activate 2>/dev/null || echo "❌ Cannot activate venv"
python -c "import food_delivery_backend.asgi; print('✅ ASGI application found')" 2>/dev/null || echo "❌ ASGI application not found"

# 6. ตรวจสอบ environment file
echo ""
echo "=== STEP 6: Environment Check ==="
if [ -f .env ]; then
    echo "✅ .env file exists"
    echo "Environment variables:"
    head -5 .env
else
    echo "❌ .env file not found"
fi

# 7. ทดสอบรัน Daphne แบบ manual
echo ""
echo "=== STEP 7: Manual Test ==="
echo "Testing Daphne manually for 5 seconds..."
timeout 5s /home/ubuntu/venv/bin/daphne -v 2 -b 127.0.0.1 -p 8002 food_delivery_backend.asgi:application 2>&1 || echo "Manual test completed"

echo ""
echo "=== SUMMARY ==="
echo "🔧 To fix common issues:"
echo "1. sudo systemctl stop daphne"
echo "2. Check and fix paths in /etc/systemd/system/daphne.service"
echo "3. sudo systemctl daemon-reload"
echo "4. sudo systemctl start daphne"
echo ""
echo "📋 Debug commands:"
echo "- sudo journalctl -u daphne -f (watch logs)"
echo "- sudo systemctl edit daphne (edit service)"
echo "- Manual test: cd /home/ubuntu/food_delivery_asean_mall && source /home/ubuntu/venv/bin/activate && daphne food_delivery_backend.asgi:application"