# AWS EC2 Connection Troubleshooting

## ปัญหา: SSH Connection Timeout

### วิธีแก้ไขทีละขั้นตอน:

## 1. ตรวจสอบ EC2 Instance

### ใน AWS Console:
1. ไปที่ **EC2 Dashboard**
2. เลือก **Instances**
3. ตรวจสอบ Instance ของคุณ:
   - **Instance State**: ต้องเป็น `running`
   - **Status Checks**: ต้องเป็น `2/2 checks passed`
   - **Public IPv4 address**: จดไว้ (อาจจะเปลี่ยน)

### หาก Instance หยุดทำงาน:
```bash
# เริ่ม Instance ใหม่
Right-click > Instance State > Start
```

## 2. ตรวจสอบ Security Group

### ใน EC2 Console > Security Groups:
1. เลือก Security Group ที่ใช้กับ Instance
2. ตรวจสอบ **Inbound Rules**:

```
Type        Protocol    Port Range    Source
SSH         TCP         22           0.0.0.0/0
HTTP        TCP         80           0.0.0.0/0  
HTTPS       TCP         443          0.0.0.0/0
Custom TCP  TCP         8001         0.0.0.0/0 (สำหรับ WebSocket)
```

### หากไม่มี SSH Rule:
1. คลิก **Edit inbound rules**
2. คลิก **Add rule**
3. เลือก **Type: SSH**
4. **Source: 0.0.0.0/0** (หรือ IP ของคุณ)
5. คลิก **Save rules**

## 3. ตรวจสอบ Network ACL

### ใน VPC Console > Network ACLs:
1. เลือก Network ACL ที่เกี่ยวข้อง
2. ตรวจสอบ **Inbound Rules**:
   - Rule #100: Allow SSH (22) from 0.0.0.0/0
   - Rule #*: Allow All Traffic

## 4. ลองวิธีเชื่อมต่ออื่น

### A. ใช้ EC2 Instance Connect (ใน Browser):
1. ไปที่ EC2 Console
2. เลือก Instance
3. คลิก **Connect**
4. เลือก **EC2 Instance Connect**
5. คลิก **Connect**

### B. ใช้ Session Manager (ถ้าติดตั้ง SSM Agent):
1. ไปที่ **Systems Manager Console**
2. เลือก **Session Manager**
3. คลิก **Start session**
4. เลือก Instance ของคุณ

### C. ลอง SSH ด้วย IP ใหม่:
```bash
# ตรวจสอบ IP ปัจจุบันใน AWS Console แล้วใช้
ssh -i "food_delivery.pem" ubuntu@<NEW_PUBLIC_IP>
```

## 5. ตรวจสอบ Instance จาก AWS Console

### System Log:
1. เลือก Instance
2. **Actions > Monitor and troubleshoot > Get system log**
3. ดูว่ามี error อะไรหรือไม่

### Instance Screenshot:
1. **Actions > Monitor and troubleshoot > Get instance screenshot**
2. ดูสถานะหน้าจอ

## 6. วิธีแก้ไขเฉพาะหน้า

### หาก Instance ยัง hang:
1. **Actions > Instance state > Reboot**
2. รอ 2-3 นาที
3. ลอง SSH ใหม่

### หาก Reboot ไม่ได้ผล:
1. **Actions > Instance state > Stop**
2. รอจนสถานะเป็น `stopped`
3. **Actions > Instance state > Start**
4. รอจนสถานะเป็น `running`
5. ตรวจสอบ Public IP ใหม่
6. ลอง SSH ด้วย IP ใหม่

## 7. คำสั่ง SSH ที่ถูกต้อง

```bash
# ตรวจสอบ permissions ของ key file
chmod 400 food_delivery.pem

# SSH ด้วย verbose mode เพื่อดู error
ssh -v -i "food_delivery.pem" ubuntu@<PUBLIC_IP>

# หรือลองด้วย IP address โดยตรง
ssh -i "food_delivery.pem" ubuntu@15.165.242.203
```

## 8. หากยังไม่ได้ผล

### สร้าง Instance ใหม่:
1. สร้าง AMI จาก Instance เดิม (ถ้าทำได้)
2. Launch Instance ใหม่จาก AMI
3. ใช้ Security Group และ Key Pair เดิม
4. ตรวจสอบการตั้งค่าทั้งหมดใหม่

### ติดต่อ AWS Support:
หากปัญหายังไม่หาย อาจจะเป็นปัญหาของ AWS infrastructure