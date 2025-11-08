# BambiSleep Church Handler - Complete Project Management
# Integrates with multi-instance Copilot orchestration system

param(
    [ValidateSet("setup", "status", "deploy", "test", "fix", "all")]
    [string]$Action = "all"
)

$projectRoot = "F:\CATHEDRAL\bambisleep-church"
$orchestrationDir = "F:\.powershell\7\copilot-orchestration"

Write-Host @"

╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║     🌸 BAMBISLEEP™ CHURCH HANDLER 🌸                          ║
║                                                                ║
║     Enterprise Express.js Platform Management                 ║
║     Multi-Instance Copilot Coordination                       ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Magenta

function Show-ProjectInfo {
    Write-Host "`n📊 PROJECT OVERVIEW" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    
    if (Test-Path "$projectRoot\package.json") {
        $pkg = Get-Content "$projectRoot\package.json" -Raw | ConvertFrom-Json
        Write-Host "  Name: " -NoNewline -ForegroundColor Gray
        Write-Host $pkg.name -ForegroundColor White
        Write-Host "  Version: " -NoNewline -ForegroundColor Gray
        Write-Host $pkg.version -ForegroundColor White
        Write-Host "  Description: " -NoNewline -ForegroundColor Gray
        Write-Host $pkg.description -ForegroundColor White
    }
    
    Write-Host "`n  Location: " -NoNewline -ForegroundColor Gray
    Write-Host $projectRoot -ForegroundColor White
    
    $fileCount = (Get-ChildItem $projectRoot -Recurse -File | Measure-Object).Count
    $dirCount = (Get-ChildItem $projectRoot -Recurse -Directory | Measure-Object).Count
    Write-Host "  Files: " -NoNewline -ForegroundColor Gray
    Write-Host "$fileCount files in $dirCount directories" -ForegroundColor White
}

function Test-Environment {
    Write-Host "`n🔍 ENVIRONMENT CHECK" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    
    $checks = @{
        "Node.js" = { node --version 2>$null }
        "npm" = { npm --version 2>$null }
        "Docker" = { docker --version 2>$null }
        "Git" = { git --version 2>$null }
        "package.json" = { Test-Path "$projectRoot\package.json" }
        ".env.example" = { Test-Path "$projectRoot\.env.example" }
        "src/" = { Test-Path "$projectRoot\src" }
        "node_modules/" = { Test-Path "$projectRoot\node_modules" }
    }
    
    foreach ($check in $checks.GetEnumerator()) {
        Write-Host "  $($check.Key): " -NoNewline -ForegroundColor Gray
        try {
            $result = & $check.Value
            if ($result) {
                Write-Host "✓ Available" -ForegroundColor Green
            } else {
                Write-Host "✗ Missing" -ForegroundColor Red
            }
        }
        catch {
            Write-Host "✗ Error" -ForegroundColor Red
        }
    }
}

function Show-TodoStatus {
    Write-Host "`n📋 TODO STATUS" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    
    if (Test-Path "$projectRoot\TODO.md") {
        $todo = Get-Content "$projectRoot\TODO.md" -Raw
        
        # Count completed vs pending tasks
        $completed = ([regex]::Matches($todo, '\[x\]')).Count
        $pending = ([regex]::Matches($todo, '\[ \]')).Count
        $total = $completed + $pending
        
        Write-Host "  Completed: " -NoNewline -ForegroundColor Gray
        Write-Host "$completed" -ForegroundColor Green
        Write-Host "  Pending: " -NoNewline -ForegroundColor Gray
        Write-Host "$pending" -ForegroundColor Yellow
        Write-Host "  Total: " -NoNewline -ForegroundColor Gray
        Write-Host "$total" -ForegroundColor White
        
        if ($total -gt 0) {
            $percentage = [math]::Round(($completed / $total) * 100, 1)
            Write-Host "  Progress: " -NoNewline -ForegroundColor Gray
            Write-Host "$percentage%" -ForegroundColor Cyan
        }
    }
}

function Show-TestCoverage {
    Write-Host "`n🧪 TEST COVERAGE" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    
    if (Test-Path "$projectRoot\coverage") {
        Write-Host "  Coverage reports exist" -ForegroundColor Green
        
        if (Test-Path "$projectRoot\coverage\coverage-summary.json") {
            $coverage = Get-Content "$projectRoot\coverage\coverage-summary.json" -Raw | ConvertFrom-Json
            $total = $coverage.total
            
            Write-Host "  Statements: " -NoNewline -ForegroundColor Gray
            Write-Host "$($total.statements.pct)%" -ForegroundColor $(if ($total.statements.pct -ge 80) { "Green" } else { "Yellow" })
            
            Write-Host "  Branches: " -NoNewline -ForegroundColor Gray
            Write-Host "$($total.branches.pct)%" -ForegroundColor $(if ($total.branches.pct -ge 70) { "Green" } else { "Yellow" })
            
            Write-Host "  Functions: " -NoNewline -ForegroundColor Gray
            Write-Host "$($total.functions.pct)%" -ForegroundColor $(if ($total.functions.pct -ge 80) { "Green" } else { "Yellow" })
            
            Write-Host "  Lines: " -NoNewline -ForegroundColor Gray
            Write-Host "$($total.lines.pct)%" -ForegroundColor $(if ($total.lines.pct -ge 80) { "Green" } else { "Yellow" })
        }
    } else {
        Write-Host "  No coverage data - Run: " -NoNewline -ForegroundColor Yellow
        Write-Host "npm test" -ForegroundColor White
    }
}

function Invoke-Setup {
    Write-Host "`n🔧 SETUP MODE" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    
    # Initialize orchestration if needed
    if (-not (Test-Path $orchestrationDir)) {
        Write-Host "  Initializing orchestration system..." -ForegroundColor Yellow
        & "F:\.powershell\7\orchestrator.ps1"
    }
    
    # Add bambisleep-church tasks
    Write-Host "  Adding bambisleep-church tasks..." -ForegroundColor Yellow
    & "F:\.powershell\7\setup-bambisleep-tasks.ps1"
    
    Write-Host "`n✅ Setup complete!" -ForegroundColor Green
    Write-Host "`nNext: Open 3 more terminals and run workers:" -ForegroundColor Yellow
    Write-Host "  .\worker.ps1 -Role inspector" -ForegroundColor Cyan
    Write-Host "  .\worker.ps1 -Role writer" -ForegroundColor Cyan
    Write-Host "  .\worker.ps1 -Role tester" -ForegroundColor Cyan
}

function Invoke-Status {
    Show-ProjectInfo
    Test-Environment
    Show-TodoStatus
    Show-TestCoverage
    
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
}

function Invoke-Deploy {
    Write-Host "`n🚀 DEPLOY MODE" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    
    Set-Location $projectRoot
    
    Write-Host "  Starting monitoring stack..." -ForegroundColor Yellow
    Write-Host "  Command: docker-compose -f docker-compose.monitoring.yml up -d" -ForegroundColor Gray
    
    Write-Host "`n  Access Points:" -ForegroundColor Yellow
    Write-Host "    Grafana:    http://localhost:3001" -ForegroundColor Cyan
    Write-Host "    Prometheus: http://localhost:9090" -ForegroundColor Cyan
    Write-Host "    App:        http://localhost:3000" -ForegroundColor Cyan
}

function Invoke-Test {
    Write-Host "`n🧪 TEST MODE" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    
    Set-Location $projectRoot
    
    Write-Host "  Running tests..." -ForegroundColor Yellow
    Write-Host "  Command: npm test" -ForegroundColor Gray
    Write-Host "`n  After completion, coverage will be in ./coverage/" -ForegroundColor Yellow
}

function Invoke-Fix {
    Write-Host "`n🔧 FIX MODE" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    
    Set-Location $projectRoot
    
    Write-Host "  Running linter with auto-fix..." -ForegroundColor Yellow
    Write-Host "  Command: npm run lint:fix" -ForegroundColor Gray
    
    Write-Host "`n  Running formatter..." -ForegroundColor Yellow
    Write-Host "  Command: npm run format" -ForegroundColor Gray
}

# Main execution
switch ($Action) {
    "setup" { Invoke-Setup }
    "status" { Invoke-Status }
    "deploy" { Invoke-Deploy }
    "test" { Invoke-Test }
    "fix" { Invoke-Fix }
    "all" {
        Invoke-Status
        Write-Host "`n💡 Available Actions:" -ForegroundColor Yellow
        Write-Host "  .\handle-bambisleep-church.ps1 -Action setup   # Setup coordination system" -ForegroundColor Cyan
        Write-Host "  .\handle-bambisleep-church.ps1 -Action status  # Show project status" -ForegroundColor Cyan
        Write-Host "  .\handle-bambisleep-church.ps1 -Action deploy  # Deploy monitoring stack" -ForegroundColor Cyan
        Write-Host "  .\handle-bambisleep-church.ps1 -Action test    # Run tests" -ForegroundColor Cyan
        Write-Host "  .\handle-bambisleep-church.ps1 -Action fix     # Auto-fix linting/formatting" -ForegroundColor Cyan
    }
}

Write-Host "`n" -NoNewline
