FROM node:18-alpine AS builder

WORKDIR /app

# ติดตั้ง dependencies ด้วย cache ที่ดีขึ้น
COPY package*.json ./
RUN npm ci

# คัดลอกซอร์สโค้ดที่เหลือ
COPY . .

# รับค่า API URL ตอน build (ไม่บังคับ). ถ้าไม่ส่ง จะใช้ค่าใน .env/.env.production
ARG VITE_API_URL

# สร้างไฟล์ production build (ส่งผ่าน env ให้ Vite เฉพาะกรณีมีค่า ARG)
RUN if [ -n "$VITE_API_URL" ]; then \
      echo "Using build arg VITE_API_URL=$VITE_API_URL"; \
      export VITE_API_URL="$VITE_API_URL"; \
    fi && npm run build

# ----- Production image: Nginx เสิร์ฟไฟล์ dist พร้อม gzip/cache -----
FROM nginx:1.25-alpine AS runner

# คอนฟิก Nginx สำหรับ SPA + gzip + cache
COPY nginx.conf /etc/nginx/conf.d/default.conf

# คัดลอกไฟล์ build ไปยัง document root ของ Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]