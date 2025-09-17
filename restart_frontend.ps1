# 🔄 Restart Frontend with Production API
Write-Host "🔄 Restarting Frontend with Production API..." -ForegroundColor Cyan
Write-Host ""

# เข้าไปโฟลเดอร์ frontend
Set-Location frontend

# แสดงการตั้งค่า .env
Write-Host "📋 Current .env configuration:" -ForegroundColor Yellow
Get-Content .env
Write-Host ""

# หยุด Vite process ที่อาจรันอยู่
Write-Host "🛑 Stopping any existing Vite process..." -ForegroundColor Red
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# แสดงข้อมูลการเชื่อมต่อ
Write-Host "🚀 Starting Vite development server..." -ForegroundColor Green
Write-Host "✅ API will connect to: https://matjyp.com/api/" -ForegroundColor Green
Write-Host "✅ WebSocket will connect to: wss://matjyp.com/ws/orders/" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Frontend will be available at: http://localhost:3000" -ForegroundColor Magenta
Write-Host "📝 Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# รัน Vite development server
npm run dev