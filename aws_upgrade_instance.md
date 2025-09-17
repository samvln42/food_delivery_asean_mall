# การ Upgrade EC2 Instance Type

## ปัญหา: t3.micro มี RAM เพียง 1GB ไม่เพียงพอ

### วิธี Upgrade Instance Type:

## 1. ใน AWS Console:
1. ไปที่ **EC2 Dashboard**
2. เลือก Instance ของคุณ
3. **Instance State > Stop** (รอจนสถานะเป็น stopped)
4. คลิกขวา > **Instance Settings > Change Instance Type**
5. เลือก **t3.small** (2GB RAM) หรือ **t3.medium** (4GB RAM)
6. คลิก **Apply**
7. **Instance State > Start**

## 2. เปรียบเทียบ Instance Types:

| Type | vCPU | RAM | Price/hour (approx) |
|------|------|-----|-------------------|
| t3.micro | 2 | 1GB | $0.0104 |
| t3.small | 2 | 2GB | $0.0208 |
| t3.medium | 2 | 4GB | $0.0416 |

## 3. หลังจาก Upgrade แล้ว:

### SSH เข้า Instance:
```bash
ssh -i "food_delivery.pem" ubuntu@15.165.242.203
```

### ตรวจสอบ Memory:
```bash
free -h
df -h
```

### รัน script แก้ไขปัญหา 504:
```bash
# อัปโหลดไฟล์แก้ไข
scp -i "food_delivery.pem" nginx_config_websocket.conf ubuntu@15.165.242.203:/tmp/
scp -i "food_delivery.pem" gunicorn.service.fixed ubuntu@15.165.242.203:/tmp/
scp -i "food_delivery.pem" daphne.service ubuntu@15.165.242.203:/tmp/
scp -i "food_delivery.pem" fix_504_timeout.sh ubuntu@15.165.242.203:/tmp/
scp -i "food_delivery.pem" check_system_health.sh ubuntu@15.165.242.203:/tmp/

# บน server
sudo cp /tmp/nginx_config_websocket.conf /etc/nginx/sites-available/default
sudo cp /tmp/gunicorn.service.fixed /etc/systemd/system/gunicorn.service
sudo cp /tmp/daphne.service /etc/systemd/system/daphne.service

chmod +x /tmp/fix_504_timeout.sh /tmp/check_system_health.sh
sudo /tmp/fix_504_timeout.sh
```

## 4. วิธีแก้ไขชั่วคราว (ถ้าไม่อยากเปลี่ยน Instance):

### ลด Gunicorn workers:
```bash
sudo nano /etc/systemd/system/gunicorn.service
# เปลี่ยน --workers 3 เป็น --workers 1

sudo systemctl daemon-reload
sudo systemctl restart gunicorn
```

### เพิ่ม Swap space:
```bash
# สร้าง swap file 1GB
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# ทำให้ permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### ปิด services ที่ไม่จำเป็น:
```bash
sudo systemctl disable snapd
sudo systemctl stop snapd
sudo systemctl disable ModemManager
sudo systemctl stop ModemManager
```

## 5. Monitor Memory Usage:

```bash
# ดู memory usage แบบ real-time
watch -n 1 'free -h && echo "---" && ps aux --sort=-%mem | head -10'

# ดู services ที่กิน memory มากที่สุด
sudo systemctl status --no-pager -l
```

## คำแนะนำ:
- **t3.small** (2GB RAM) เพียงพอสำหรับ development/testing
- **t3.medium** (4GB RAM) เหมาะสำหรับ production ขนาดเล็ก
- ต้องมี swap space อย่างน้อย 1-2GB เสมอ