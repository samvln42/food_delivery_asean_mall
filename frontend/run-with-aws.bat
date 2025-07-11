@echo off
echo 🚀 Starting Frontend with AWS Backend...
echo.
echo API URL: https://tacashop.com/api/
echo WebSocket URL: wss://tacashop.com/ws/orders/
echo.

rem ตั้งค่า environment variable
set VITE_API_URL=https://tacashop.com/api/

rem รัน development server
npm run dev 