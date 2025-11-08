# Setup BambiSleep Church Tasks for Multi-Instance Coordination
# This adds bambisleep-church handling tasks to the orchestration system

param(
    [string]$WorkDir = "F:\.powershell\7\copilot-orchestration"
)

# Ensure orchestrator has been run first
if (-not (Test-Path (Join-Path $WorkDir "task-queue.json"))) {
    Write-Host "❌ ERROR: Orchestrator not initialized!" -ForegroundColor Red
    Write-Host "Run this first: .\orchestrator.ps1" -ForegroundColor Yellow
    exit 1
}

# Load orchestrator functions
. .\orchestrator.ps1

Write-Host @"

╔════════════════════════════════════════════════════════╗
║   BAMBISLEEP-CHURCH TASK SETUP                         ║
║   Adding comprehensive codebase tasks                  ║
╚════════════════════════════════════════════════════════╝

"@ -ForegroundColor Magenta

$projectRoot = "F:\CATHEDRAL\bambisleep-church"

# Phase 1: Inspection & Analysis
Write-Host "`n📋 Phase 1: Inspection & Analysis" -ForegroundColor Cyan

Add-Task -Type "inspect" -Target "$projectRoot" -Description "Analyze project structure and dependencies" -Priority 1
Add-Task -Type "inspect" -Target "$projectRoot\src" -Description "Inspect source code architecture" -Priority 2
Add-Task -Type "inspect" -Target "$projectRoot\tests" -Description "Analyze test coverage gaps" -Priority 3
Add-Task -Type "inspect" -Target "$projectRoot\package.json" -Description "Review dependencies and scripts" -Priority 4
Add-Task -Type "inspect" -Target "$projectRoot\.env.example" -Description "Check environment configuration" -Priority 5

# Phase 2: Missing Files Recovery
Write-Host "`n📋 Phase 2: Missing Files Recovery" -ForegroundColor Cyan

Add-Task -Type "write" -Target "$projectRoot\src\mcp" -Description "Recreate src/mcp/orchestrator.js from coverage" -Priority 6
Add-Task -Type "write" -Target "$projectRoot\src\utils" -Description "Recreate src/utils/logger.js from coverage" -Priority 7
Add-Task -Type "write" -Target "$projectRoot\src\mcp" -Description "Create orchestrator.test.js for 100% coverage" -Priority 8

# Phase 3: Environment Setup
Write-Host "`n📋 Phase 3: Environment Setup" -ForegroundColor Cyan

Add-Task -Type "write" -Target "$projectRoot" -Description "Generate .env from .env.example with secure secrets" -Priority 9
Add-Task -Type "write" -Target "$projectRoot\scripts" -Description "Create setup-secrets.sh script" -Priority 10

# Phase 4: Testing & Quality
Write-Host "`n📋 Phase 4: Testing & Quality" -ForegroundColor Cyan

Add-Task -Type "test" -Target "$projectRoot" -Description "Run npm test and analyze coverage" -Priority 11
Add-Task -Type "test" -Target "$projectRoot" -Description "Run npm run lint and check for errors" -Priority 12
Add-Task -Type "test" -Target "$projectRoot" -Description "Verify all npm scripts execute properly" -Priority 13

# Phase 5: MCP Configuration
Write-Host "`n📋 Phase 5: MCP Configuration" -ForegroundColor Cyan

Add-Task -Type "inspect" -Target "$projectRoot\.vscode\settings.json" -Description "Analyze MCP server configuration" -Priority 14
Add-Task -Type "write" -Target "$projectRoot\.vscode" -Description "Update MCP servers with proper tokens" -Priority 15
Add-Task -Type "test" -Target "$projectRoot" -Description "Verify MCP servers can initialize" -Priority 16

# Phase 6: Monitoring Stack
Write-Host "`n📋 Phase 6: Monitoring Stack Deployment" -ForegroundColor Cyan

Add-Task -Type "inspect" -Target "$projectRoot\prometheus" -Description "Review Prometheus configuration" -Priority 17
Add-Task -Type "inspect" -Target "$projectRoot\grafana" -Description "Review Grafana dashboards" -Priority 18
Add-Task -Type "test" -Target "$projectRoot" -Description "Deploy monitoring stack with docker-compose" -Priority 19

# Phase 7: Documentation Updates
Write-Host "`n📋 Phase 7: Documentation" -ForegroundColor Cyan

Add-Task -Type "write" -Target "$projectRoot\docs" -Description "Update TODO.md with current progress" -Priority 20
Add-Task -Type "write" -Target "$projectRoot" -Description "Create QUICKSTART.md for new developers" -Priority 21
Add-Task -Type "inspect" -Target "$projectRoot\README.md" -Description "Verify README accuracy" -Priority 22

# Phase 8: Production Readiness
Write-Host "`n📋 Phase 8: Production Readiness" -ForegroundColor Cyan

Add-Task -Type "test" -Target "$projectRoot" -Description "Run security audit (npm audit)" -Priority 23
Add-Task -Type "test" -Target "$projectRoot" -Description "Test health endpoint /health" -Priority 24
Add-Task -Type "test" -Target "$projectRoot" -Description "Verify Docker build succeeds" -Priority 25

Write-Host "`n✅ Added 25 tasks for BambiSleep Church!" -ForegroundColor Green
Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "  1. Start workers in other terminals" -ForegroundColor White
Write-Host "  2. Run: " -NoNewline -ForegroundColor White
Write-Host "Watch-Progress" -ForegroundColor Cyan
Write-Host "  3. Monitor real-time progress!" -ForegroundColor White

Show-Status
