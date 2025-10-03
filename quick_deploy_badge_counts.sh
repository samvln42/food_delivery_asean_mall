#!/bin/bash

# Quick Deploy Script for Badge Counts Feature
# รันสคริปต์นี้เพื่อ deploy feature ใหม่ทั้งหมดในคำสั่งเดียว

set -e  # Exit on error

echo "🚀 Quick Deploy: Badge Counts Feature"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then 
    print_warning "This script requires sudo privileges for some operations"
    print_warning "You may be prompted for your password"
    echo ""
fi

# 1. Update code from git
print_status "Step 1: Pulling latest code from git..."
if git pull origin main; then
    print_success "Code updated successfully"
else
    print_error "Failed to pull code. Please check git status."
    exit 1
fi
echo ""

# 2. Backend deployment
print_status "Step 2: Deploying backend..."

# Activate virtual environment
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
    print_success "Virtual environment activated"
else
    print_error "Virtual environment not found at venv/bin/activate"
    exit 1
fi

# Install/update Python dependencies
print_status "Installing Python dependencies..."
pip install -r requirements.txt --quiet
print_success "Dependencies installed"

# Run migrations (if any)
print_status "Running database migrations..."
python manage.py migrate --noinput
print_success "Migrations completed"

# Collect static files
print_status "Collecting static files..."
python manage.py collectstatic --noinput --clear
print_success "Static files collected"

# Restart backend services
print_status "Restarting Gunicorn..."
sudo systemctl restart gunicorn
sleep 2
if systemctl is-active --quiet gunicorn; then
    print_success "Gunicorn restarted successfully"
else
    print_error "Gunicorn failed to start"
    sudo journalctl -u gunicorn -n 20 --no-pager
    exit 1
fi

print_status "Restarting Daphne..."
sudo systemctl restart daphne
sleep 2
if systemctl is-active --quiet daphne; then
    print_success "Daphne restarted successfully"
else
    print_error "Daphne failed to start"
    sudo journalctl -u daphne -n 20 --no-pager
    exit 1
fi

echo ""

# 3. Frontend deployment
print_status "Step 3: Deploying frontend..."

cd frontend

# Install/update Node dependencies
print_status "Installing Node dependencies..."
npm install --silent
print_success "Node dependencies installed"

# Build production bundle
print_status "Building production bundle..."
npm run build
if [ -d "dist" ]; then
    print_success "Frontend built successfully"
else
    print_error "Frontend build failed - dist directory not found"
    exit 1
fi

# Backup old files
BACKUP_DIR="/var/www/html.backup.$(date +%Y%m%d-%H%M%S)"
if [ -d "/var/www/html" ] && [ "$(ls -A /var/www/html)" ]; then
    print_status "Backing up old files to $BACKUP_DIR..."
    sudo cp -r /var/www/html "$BACKUP_DIR"
    print_success "Backup created"
fi

# Deploy new files
print_status "Deploying new frontend files..."
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html
print_success "Frontend files deployed"

# Restart nginx
print_status "Restarting Nginx..."
sudo systemctl restart nginx
if systemctl is-active --quiet nginx; then
    print_success "Nginx restarted successfully"
else
    print_error "Nginx failed to start"
    exit 1
fi

cd ..

echo ""

# 4. Verify deployment
print_status "Step 4: Verifying deployment..."

# Check backend
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/health/ | grep -q "200"; then
    print_success "Backend API is responding"
else
    print_warning "Backend API health check returned non-200"
fi

# Check services
if systemctl is-active --quiet gunicorn && systemctl is-active --quiet daphne && systemctl is-active --quiet nginx; then
    print_success "All services are running"
else
    print_warning "Some services may not be running properly"
fi

echo ""

# 5. Summary
echo "📋 DEPLOYMENT SUMMARY"
echo "======================================"
echo ""
print_success "Deployment completed successfully!"
echo ""
echo "Next steps:"
echo "1. Open your website in a browser"
echo "2. Clear browser cache (Ctrl+Shift+Del)"
echo "3. Login as admin"
echo "4. Check if badge counts are displayed"
echo ""
echo "If badge counts are still not showing:"
echo "1. Open Browser DevTools (F12)"
echo "2. Go to Console tab - check for errors"
echo "3. Go to Network tab - check API calls"
echo "4. Run: ./check_badge_counts.sh for detailed diagnostics"
echo ""

# Print service URLs
echo "📍 Service URLs:"
echo "   Frontend: http://$(hostname -I | awk '{print $1}')"
echo "   Backend API: http://$(hostname -I | awk '{print $1}')/api/"
echo ""

echo "✨ Done! Happy coding! ✨"
