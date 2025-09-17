#!/bin/bash

# Production Deployment Script for AWS Load Balancer

echo "🚀 Deploying to Production..."

# 1. Update Django settings
echo "📝 Updating Django settings..."
sudo systemctl restart gunicorn
echo "✅ Gunicorn restarted"

# 2. Build React for production
echo "🏗️ Building React app..."
cd /home/ubuntu/food_delivery_asean_mall/frontend
npm run build
echo "✅ React build completed"

# 3. Update Nginx to serve React build (not dev server)
echo "🔧 Updating Nginx configuration..."
sudo tee /etc/nginx/sites-available/default > /dev/null << 'EOF'
server {
    listen 80;
    server_name tacashop.com 15.165.242.203;

    client_max_body_size 100M;

    # Enable gzip compression
    gzip on;
    gzip_comp_level 5;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;
    gzip_vary on;

    # Serve React production build
    root /home/ubuntu/food_delivery_asean_mall/frontend/dist;
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    location ~* \.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
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

    # Static files (Django)
    location /static/ {
        alias /home/ubuntu/food_delivery_asean_mall/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Media files
    location /media/ {
        alias /home/ubuntu/food_delivery_asean_mall/media/;
        expires 1y;
        add_header Cache-Control "public";
    }
}
EOF

# 4. Test and reload Nginx
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

# 5. Final status check
echo "🏥 Checking service status..."
sudo systemctl status gunicorn --no-pager -l
sudo systemctl status nginx --no-pager -l

echo "🎉 Production deployment completed!"
echo "🌐 Your app should be available at: https://tacashop.com" 