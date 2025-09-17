@echo off
echo 🔄 Restarting Frontend with Production API...
echo.

cd frontend

echo 📋 Current .env configuration:
type .env
echo.

echo 🛑 Killing any existing Vite process...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo 🚀 Starting Vite development server...
echo ✅ API will connect to: https://matjyp.com/api/
echo ✅ WebSocket will connect to: wss://matjyp.com/ws/orders/
echo.
echo 🌐 Frontend will be available at: http://localhost:3000
echo 📝 Press Ctrl+C to stop the server
echo.

npm run dev