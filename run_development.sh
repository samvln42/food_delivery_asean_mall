#!/bin/bash

# Development Script - รัน React dev server

echo "🚀 Starting Development Environment..."

# 1. Update Nginx for development (proxy to React dev server)
echo "🔧 Updating Nginx for development..."
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

    # Backend (Django API)
    location /api/ {
        proxy_pass http://unix:/run/gunicorn.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Origin $http_origin;
    }

    # Health check endpoint
    location = /api/health/ {
        proxy_pass http://unix:/run/gunicorn.sock;
        proxy_set_header Host localhost;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
EOF

# 2. Test and reload Nginx
echo "🔍 Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded"
else
    echo "❌ Nginx configuration error!"
    exit 1
fi

# 3. Start React dev server
echo "🏗️ Starting React development server..."
cd /home/ubuntu/food_delivery_asean_mall/frontend

# Create .env file for development
echo "VITE_API_URL=https://tacashop.com/api/" > .env

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    npm install
fi

# Start dev server
echo "🚀 Starting React dev server on port 3000..."
npm run dev

echo "🎉 Development environment is ready!"
echo "🌐 Frontend: https://tacashop.com"
echo "🔧 API: https://tacashop.com/api/" 