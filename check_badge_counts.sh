#!/bin/bash

# Badge Counts Troubleshooting Script
# ใช้ตรวจสอบว่า Badge Counts API ทำงานหรือไม่

echo "🔍 Badge Counts Troubleshooting Script"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Check if backend code has badge_counts endpoint
echo "1. Checking backend code..."
if grep -q "def badge_counts" api/views.py; then
    echo -e "${GREEN}✅ badge_counts endpoint found in api/views.py${NC}"
else
    echo -e "${RED}❌ badge_counts endpoint NOT found in api/views.py${NC}"
    echo "   Please pull latest code: git pull origin main"
fi
echo ""

# 2. Check if frontend code calls getBadgeCounts
echo "2. Checking frontend code..."
if grep -q "getBadgeCounts" frontend/src/services/api.js; then
    echo -e "${GREEN}✅ getBadgeCounts function found in frontend${NC}"
else
    echo -e "${RED}❌ getBadgeCounts function NOT found in frontend${NC}"
    echo "   Please pull latest code: git pull origin main"
fi
echo ""

# 3. Check if gunicorn is running
echo "3. Checking Gunicorn service..."
if systemctl is-active --quiet gunicorn; then
    echo -e "${GREEN}✅ Gunicorn is running${NC}"
    echo "   Last restart: $(systemctl show gunicorn -p ActiveEnterTimestamp --value)"
else
    echo -e "${RED}❌ Gunicorn is NOT running${NC}"
    echo "   Restart with: sudo systemctl restart gunicorn"
fi
echo ""

# 4. Check if daphne is running
echo "4. Checking Daphne service..."
if systemctl is-active --quiet daphne; then
    echo -e "${GREEN}✅ Daphne is running${NC}"
    echo "   Last restart: $(systemctl show daphne -p ActiveEnterTimestamp --value)"
else
    echo -e "${RED}❌ Daphne is NOT running${NC}"
    echo "   Restart with: sudo systemctl restart daphne"
fi
echo ""

# 5. Check Python virtual environment
echo "5. Checking Python virtual environment..."
if [ -d "venv" ]; then
    echo -e "${GREEN}✅ Virtual environment exists${NC}"
    if [ -n "$VIRTUAL_ENV" ]; then
        echo -e "${GREEN}✅ Virtual environment is activated${NC}"
    else
        echo -e "${YELLOW}⚠️  Virtual environment is NOT activated${NC}"
        echo "   Activate with: source venv/bin/activate"
    fi
else
    echo -e "${RED}❌ Virtual environment NOT found${NC}"
fi
echo ""

# 6. Check recent gunicorn logs
echo "6. Recent Gunicorn logs (last 5 lines)..."
sudo journalctl -u gunicorn -n 5 --no-pager | tail -n 5
echo ""

# 7. Check recent daphne logs
echo "7. Recent Daphne logs (last 5 lines)..."
sudo journalctl -u daphne -n 5 --no-pager | tail -n 5
echo ""

# 8. Check if frontend is built
echo "8. Checking frontend build..."
if [ -d "frontend/dist" ]; then
    BUILD_TIME=$(stat -c %y frontend/dist 2>/dev/null || stat -f %Sm frontend/dist 2>/dev/null)
    echo -e "${GREEN}✅ Frontend build exists${NC}"
    echo "   Build time: $BUILD_TIME"
else
    echo -e "${RED}❌ Frontend build NOT found${NC}"
    echo "   Build with: cd frontend && npm run build"
fi
echo ""

# 9. Summary and recommendations
echo "📋 SUMMARY & RECOMMENDATIONS"
echo "========================================"
echo ""

# Check git status
GIT_BEHIND=$(git rev-list --count HEAD..origin/main 2>/dev/null)
if [ "$GIT_BEHIND" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Your code is $GIT_BEHIND commits behind origin/main${NC}"
    echo "   Update with: git pull origin main"
    echo ""
fi

echo "💡 Quick Fix Commands:"
echo "------------------------"
echo "1. Update code:"
echo "   git pull origin main"
echo ""
echo "2. Restart backend services:"
echo "   sudo systemctl restart gunicorn"
echo "   sudo systemctl restart daphne"
echo ""
echo "3. Rebuild and deploy frontend:"
echo "   cd frontend"
echo "   npm install"
echo "   npm run build"
echo "   sudo cp -r dist/* /var/www/html/"
echo ""
echo "4. Clear browser cache:"
echo "   Ctrl+Shift+Del (or Cmd+Shift+Del on Mac)"
echo "   Or open in Incognito/Private mode"
echo ""

echo "✅ Troubleshooting check completed!"
