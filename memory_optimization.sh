#!/bin/bash

echo "🔧 การแก้ไขปัญหา Memory สำหรับ t3.micro"
echo "============================================="

# 1. เพิ่ม Swap Space
echo "📁 สร้าง Swap File 1GB..."
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# ทำให้ permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

echo "✅ Swap space created:"
free -h

# 2. ลด Gunicorn Workers
echo ""
echo "⚙️  ปรับลด Gunicorn workers..."
sudo sed -i 's/--workers 3/--workers 1/g' /etc/systemd/system/gunicorn.service

# 3. ปิด Services ที่ไม่จำเป็น
echo ""
echo "🛑 ปิด services ที่ไม่จำเป็น..."
sudo systemctl disable snapd --now
sudo systemctl disable ModemManager --now
sudo systemctl disable containerd --now
sudo systemctl disable docker --now

# 4. ปรับ Memory Swappiness
echo ""
echo "💾 ปรับ memory swappiness..."
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl vm.swappiness=10

# 5. Restart Services
echo ""
echo "🔄 รีสตาร์ท services..."
sudo systemctl daemon-reload
sudo systemctl restart gunicorn
sudo systemctl restart daphne
sudo systemctl restart nginx

# 6. ตรวจสอบสถานะ
echo ""
echo "📊 ตรวจสอบสถานะ Memory:"
free -h

echo ""
echo "📊 ตรวจสอบสถานะ Services:"
sudo systemctl status gunicorn --no-pager -l
sudo systemctl status daphne --no-pager -l
sudo systemctl status nginx --no-pager -l

echo ""
echo "📊 Top Memory Usage:"
ps aux --sort=-%mem | head -10

echo ""
echo "✅ การปรับแต่งเสร็จสิ้น!"
echo "🔍 ตรวจสอบเว็บไซต์ที่: https://tacashop.com"