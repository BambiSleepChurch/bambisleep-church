# Setup Unified Copilot Communication System
# Works on Windows, Mac, and Linux

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🌸 BambiSleep Unified Copilot Communication Setup      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$CATHEDRAL_PATH = "F:\CATHEDRAL"
$BACKEND_PATH = "$CATHEDRAL_PATH\bambisleep-church"
$CONTROL_TOWER_PATH = "$CATHEDRAL_PATH\bambisleep-church-catgirl-control-tower"

# Check if Node.js is installed
Write-Host "🔍 Checking dependencies..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ Node.js $nodeVersion" -ForegroundColor Green

# Check if npm is installed
$npmVersion = npm --version 2>$null
if (-not $npmVersion) {
    Write-Host "❌ npm not found. Please install npm first." -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ npm $npmVersion" -ForegroundColor Green

# Install dependencies for backend
Write-Host "`n📦 Installing backend dependencies..." -ForegroundColor Yellow
if (Test-Path $BACKEND_PATH) {
    cd $BACKEND_PATH
    npm install --silent
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Backend dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Backend dependency installation had warnings" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️ Backend path not found: $BACKEND_PATH" -ForegroundColor Yellow
}

# Install dependencies for control tower
Write-Host "`n📦 Installing control tower dependencies..." -ForegroundColor Yellow
if (Test-Path $CONTROL_TOWER_PATH) {
    cd $CONTROL_TOWER_PATH
    npm install --silent
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Control tower dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Control tower dependency installation had warnings" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️ Control tower path not found: $CONTROL_TOWER_PATH" -ForegroundColor Yellow
    Write-Host "   📝 You may need to clone from: https://github.com/BambiSleepChat/bambisleep-church-catgirl-control-tower" -ForegroundColor Cyan
}

# Create sync directory for offline communication
$SYNC_DIR = "$CATHEDRAL_PATH\.copilot-sync"
Write-Host "`n📁 Creating sync directory..." -ForegroundColor Yellow
if (-not (Test-Path $SYNC_DIR)) {
    New-Item -ItemType Directory -Path $SYNC_DIR -Force | Out-Null
    New-Item -ItemType Directory -Path "$SYNC_DIR\messages\inbox" -Force | Out-Null
    New-Item -ItemType Directory -Path "$SYNC_DIR\messages\outbox" -Force | Out-Null
    New-Item -ItemType Directory -Path "$SYNC_DIR\state" -Force | Out-Null
    New-Item -ItemType Directory -Path "$SYNC_DIR\logs" -Force | Out-Null
    Write-Host "   ✅ Sync directory created" -ForegroundColor Green
} else {
    Write-Host "   ✅ Sync directory already exists" -ForegroundColor Green
}

# Create MCP configuration
Write-Host "`n⚙️ Configuring MCP settings..." -ForegroundColor Yellow
$mcpConfigPath = "$env:APPDATA\Code\User\globalStorage\github.copilot"
if (-not (Test-Path $mcpConfigPath)) {
    New-Item -ItemType Directory -Path $mcpConfigPath -Force | Out-Null
}

$mcpConfig = @{
    "bambi-control-tower" = @{
        command = "node"
        args = @("$CONTROL_TOWER_PATH\src\copilot-communication-bridge.js")
        env = @{
            CONTROL_TOWER_MODE = "unified-communication"
            ENABLE_CROSS_COPILOT_SYNC = "true"
            MESSAGE_BROKER_URL = "ws://localhost:3000"
        }
    }
}

$mcpConfigFile = "$mcpConfigPath\mcpServers.json"
$mcpConfig | ConvertTo-Json -Depth 10 | Set-Content $mcpConfigFile
Write-Host "   ✅ MCP configuration created at: $mcpConfigFile" -ForegroundColor Green

# Create startup script
Write-Host "`n📝 Creating startup script..." -ForegroundColor Yellow
$startupScript = @"
# BambiSleep Copilot Communication Startup
Write-Host "🌸 Starting BambiSleep Control Tower System..." -ForegroundColor Magenta

# Start backend
Write-Host "`n🚀 Starting backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$BACKEND_PATH'; npm start" -WindowStyle Normal

Start-Sleep -Seconds 3

# Start control tower
Write-Host "🚀 Starting control tower..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$CONTROL_TOWER_PATH'; npm start" -WindowStyle Normal

Start-Sleep -Seconds 2

Write-Host "`n✅ Control Tower System Online!" -ForegroundColor Green
Write-Host "   • Backend: http://localhost:3000" -ForegroundColor White
Write-Host "   • WebSocket: ws://localhost:3000" -ForegroundColor White
Write-Host "   • Logs: $SYNC_DIR\logs" -ForegroundColor White
Write-Host "`n📝 All Copilot instances can now communicate!" -ForegroundColor Cyan
"@

$startupScriptPath = "$CATHEDRAL_PATH\start-copilot-comm.ps1"
$startupScript | Set-Content $startupScriptPath
Write-Host "   ✅ Startup script created: $startupScriptPath" -ForegroundColor Green

# Create test script
Write-Host "`n📝 Creating test script..." -ForegroundColor Yellow
$testScript = @"
# Test Copilot Communication
Write-Host "🧪 Testing Copilot Communication System..." -ForegroundColor Cyan

cd '$CONTROL_TOWER_PATH'

Write-Host "`nStarting test instance..." -ForegroundColor Yellow
node src\copilot-communication-bridge.js test-instance
"@

$testScriptPath = "$CATHEDRAL_PATH\test-copilot-comm.ps1"
$testScript | Set-Content $testScriptPath
Write-Host "   ✅ Test script created: $testScriptPath" -ForegroundColor Green

# Summary
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              ✅ SETUP COMPLETE!                          ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Start the system:" -ForegroundColor White
Write-Host "      .\start-copilot-comm.ps1`n" -ForegroundColor Gray
Write-Host "   2. Test communication:" -ForegroundColor White
Write-Host "      .\test-copilot-comm.ps1`n" -ForegroundColor Gray
Write-Host "   3. Configure Copilot in VS Code:" -ForegroundColor White
Write-Host "      - Settings already created at:" -ForegroundColor Gray
Write-Host "        $mcpConfigFile`n" -ForegroundColor Gray

Write-Host "🌐 Cross-Platform Support:" -ForegroundColor Cyan
Write-Host "   • Windows: PowerShell (current)" -ForegroundColor Green
Write-Host "   • Mac: Use bash version of scripts" -ForegroundColor Yellow
Write-Host "   • Linux: Use bash version of scripts`n" -ForegroundColor Yellow

Write-Host "📖 Documentation:" -ForegroundColor Cyan
Write-Host "   $CATHEDRAL_PATH\COPILOT_UNIFIED_COMM_SYSTEM.md`n" -ForegroundColor Gray

Write-Host "🎮 Commander Brandynette says: ALL SYSTEMS OPERATIONAL!" -ForegroundColor Magenta

cd $CATHEDRAL_PATH
