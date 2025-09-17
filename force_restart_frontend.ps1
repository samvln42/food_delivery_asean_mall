# 🔥 Force Restart Frontend - Kill all Node processes and restart cleanly
Write-Host "🔥 Force Restarting Frontend with Production API..." -ForegroundColor Red
Write-Host ""

# เข้าไปโฟลเดอร์ frontend
Set-Location frontend

# แสดงการตั้งค่า .env
Write-Host "📋 Current .env configuration:" -ForegroundColor Yellow
Get-Content .env -ErrorAction SilentlyContinue
Write-Host ""

# ฆ่า Node processes ทั้งหมด
Write-Host "🛑 Killing ALL Node.js processes..." -ForegroundColor Red
Get-Process node -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "  Killing PID: $($_.Id) - $($_.ProcessName)" -ForegroundColor Gray
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}

# ฆ่า processes ที่เกี่ยวข้องกับ Vite
Get-Process -Name "*vite*" -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "  Killing Vite PID: $($_.Id)" -ForegroundColor Gray
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}

Write-Host "⏳ Waiting 3 seconds for processes to fully terminate..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# ล้าง npm cache
Write-Host "🧹 Cleaning npm cache..." -ForegroundColor Cyan
npm cache clean --force 2>$null

# ตรวจสอบว่า port 3000 ว่างหรือไม่
Write-Host "🔍 Checking if port 3000 is free..." -ForegroundColor Cyan
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    Write-Host "⚠️  Port 3000 is still in use, attempting to free it..." -ForegroundColor Yellow
    $processId = $port3000.OwningProcess
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "🚀 Starting fresh Vite development server..." -ForegroundColor Green
Write-Host "✅ API will connect to: https://matjyp.com/api/" -ForegroundColor Green
Write-Host "✅ WebSocket will connect to: wss://matjyp.com/ws/orders/" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Frontend will be available at: http://localhost:3000" -ForegroundColor Magenta
Write-Host "📝 Watch the console for environment variable debugging info" -ForegroundColor Yellow
Write-Host "📝 Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# รัน Vite development server
npm run dev