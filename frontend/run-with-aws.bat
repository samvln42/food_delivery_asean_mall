@echo off
echo 🚀 Starting Frontend with AWS Backend...
echo.
echo API URL: https://matjyp.com/api/
echo WebSocket URL: wss://matjyp.com/ws/orders/
echo.

rem ตั้งค่า environment variable
set VITE_API_URL=https://matjyp.com/api/

rem รัน development server
npm run dev 