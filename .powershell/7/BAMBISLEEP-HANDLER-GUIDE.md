# 🌸 BambiSleep Church - Complete Handler Guide 🌸

## Quick Status Check

Run this command to see project overview:
```powershell
cd F:\.powershell\7
.\handle-bambisleep-church.ps1 -Action status
```

## What You Get

### ✅ Files Created in `F:\.powershell\7\`:

1. **orchestrator.ps1** - Main coordination system
2. **worker.ps1** - Worker instances (inspector/writer/tester)
3. **setup-bambisleep-tasks.ps1** - 25 tasks for bambisleep-church
4. **handle-bambisleep-church.ps1** - Main project handler
5. **README-COORDINATION.md** - Full coordination docs
6. **QUICKSTART.md** - Quick start guide

### 📊 BambiSleep Church Project

**Location**: `F:\CATHEDRAL\bambisleep-church`

**Stack**:
- Express.js 4.19.2 (ES Modules)
- OpenTelemetry + Prometheus + Winston
- Stripe Payments
- JWT Auth + bcrypt
- WebSocket (ws)
- 8 MCP Servers

**Current State** (from TODO.md):
- ✅ Phase 1-4: Complete (Telemetry, Monitoring, Cleanup)
- ⚠️ Phase 5: Pending (Production Deployment)
- ⚠️ Missing Files: `src/mcp/orchestrator.js`, `src/utils/logger.js`
- 📊 Test Coverage: 79.28% statements (target: 100%)

---

## 🚀 Quick Start Guide

### Step 1: Check Project Status

```powershell
cd F:\.powershell\7
.\handle-bambisleep-church.ps1 -Action status
```

**Shows:**
- Project info (name, version, file count)
- Environment check (Node, npm, Docker, Git)
- TODO progress (completed vs pending tasks)
- Test coverage stats

---

### Step 2: Setup Coordination System

```powershell
cd F:\.powershell\7
.\handle-bambisleep-church.ps1 -Action setup
```

**Does:**
- Initializes orchestration system
- Adds 25 bambisleep-church tasks to queue
- Shows commands for starting workers

---

### Step 3: Start Multi-Instance Workers

#### Terminal 1 (Current) - ORCHESTRATOR:
```powershell
cd F:\.powershell\7
.\orchestrator.ps1
```

#### Terminal 2 - INSPECTOR (File Analysis):
```powershell
cd F:\.powershell\7
.\worker.ps1 -Role inspector
```

#### Terminal 3 - WRITER (File Creation):
```powershell
cd F:\.powershell\7
.\worker.ps1 -Role writer
```

#### Terminal 4 - TESTER (Validation):
```powershell
cd F:\.powershell\7
.\worker.ps1 -Role tester
```

---

## 📋 The 25 Tasks (8 Phases)

### Phase 1: Inspection & Analysis (5 tasks)
- [ ] Task 1: Analyze project structure
- [ ] Task 2: Inspect source code architecture
- [ ] Task 3: Analyze test coverage gaps
- [ ] Task 4: Review dependencies and scripts
- [ ] Task 5: Check environment configuration

### Phase 2: Missing Files Recovery (3 tasks)
- [ ] Task 6: Recreate `src/mcp/orchestrator.js`
- [ ] Task 7: Recreate `src/utils/logger.js`
- [ ] Task 8: Create `orchestrator.test.js`

### Phase 3: Environment Setup (2 tasks)
- [ ] Task 9: Generate `.env` with secure secrets
- [ ] Task 10: Create `setup-secrets.sh` script

### Phase 4: Testing & Quality (3 tasks)
- [ ] Task 11: Run `npm test` and analyze coverage
- [ ] Task 12: Run `npm run lint`
- [ ] Task 13: Verify all npm scripts

### Phase 5: MCP Configuration (3 tasks)
- [ ] Task 14: Analyze MCP server configuration
- [ ] Task 15: Update MCP servers with tokens
- [ ] Task 16: Verify MCP servers initialize

### Phase 6: Monitoring Stack (3 tasks)
- [ ] Task 17: Review Prometheus config
- [ ] Task 18: Review Grafana dashboards
- [ ] Task 19: Deploy monitoring stack

### Phase 7: Documentation (3 tasks)
- [ ] Task 20: Update TODO.md
- [ ] Task 21: Create QUICKSTART.md
- [ ] Task 22: Verify README accuracy

### Phase 8: Production Readiness (3 tasks)
- [ ] Task 23: Run security audit
- [ ] Task 24: Test health endpoint
- [ ] Task 25: Verify Docker build

---

## 🔧 Handler Actions

### View Status
```powershell
.\handle-bambisleep-church.ps1 -Action status
```

### Setup Tasks
```powershell
.\handle-bambisleep-church.ps1 -Action setup
```

### Deploy Monitoring
```powershell
.\handle-bambisleep-church.ps1 -Action deploy
```

### Run Tests
```powershell
.\handle-bambisleep-church.ps1 -Action test
```

### Auto-Fix Code
```powershell
.\handle-bambisleep-church.ps1 -Action fix
```

### Show All Options
```powershell
.\handle-bambisleep-church.ps1 -Action all
```

---

## 📊 Monitoring Access

After deploying monitoring stack:

- **Grafana**: http://localhost:3001 (6 dashboards)
- **Prometheus**: http://localhost:9090 (20+ metrics)
- **App Server**: http://localhost:3000
- **Metrics Endpoint**: http://localhost:3000/metrics
- **DORA Dashboard**: http://localhost:3000/dora

---

## 🎯 Workflow Example

### Scenario: Complete bambisleep-church setup

```powershell
# Terminal 1: Check status
cd F:\.powershell\7
.\handle-bambisleep-church.ps1 -Action status

# Terminal 1: Setup tasks
.\handle-bambisleep-church.ps1 -Action setup

# Terminal 1: Start orchestrator
.\orchestrator.ps1

# Terminal 2: Start inspector
cd F:\.powershell\7
.\worker.ps1 -Role inspector

# Terminal 3: Start writer
cd F:\.powershell\7
.\worker.ps1 -Role writer

# Terminal 4: Start tester
cd F:\.powershell\7
.\worker.ps1 -Role tester

# Terminal 1: Watch progress
Watch-Progress
```

Workers will automatically:
1. Inspector claims inspection tasks (analyze project)
2. Writer claims write tasks (create missing files)
3. Tester claims test tasks (validate everything)
4. Results logged to `results.json`

---

## 💡 Adding Custom Tasks

From orchestrator terminal:

```powershell
# Source orchestrator functions
. .\orchestrator.ps1

# Add custom task
Add-Task -Type "inspect" `
  -Target "F:\CATHEDRAL\bambisleep-church\src\routes" `
  -Description "Deep analysis of route handlers" `
  -Priority 1

# Add write task
Add-Task -Type "write" `
  -Target "F:\CATHEDRAL\bambisleep-church\docs" `
  -Description "Create API documentation" `
  -Priority 2

# View current status
Show-Status

# Watch real-time
Watch-Progress
```

---

## 🔍 Monitoring Progress

### View Queue State
```powershell
Get-Content F:\.powershell\7\copilot-orchestration\task-queue.json | `
  ConvertFrom-Json | `
  Select-Object @{N='Pending';E={$_.pending.Count}}, `
                @{N='InProgress';E={$_.inProgress.Count}}, `
                @{N='Completed';E={$_.completed.Count}}
```

### View Results
```powershell
Get-Content F:\.powershell\7\copilot-orchestration\results.json | `
  ConvertFrom-Json | `
  Select-Object -ExpandProperty results | `
  Format-Table taskId, role, description, success
```

### View Worker Status
```powershell
Get-Content F:\.powershell\7\copilot-orchestration\status.json | `
  ConvertFrom-Json | `
  Select-Object -ExpandProperty instances
```

---

## 🐛 Troubleshooting

### PowerShell Execution Policy
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### Reset Coordination System
```powershell
Remove-Item F:\.powershell\7\copilot-orchestration -Recurse -Force
.\orchestrator.ps1
```

### Stale Lock File
```powershell
Remove-Item F:\.powershell\7\copilot-orchestration\.queue.lock -Force
```

### View Logs
Workers output to console - check each terminal for detailed logs

---

## 📚 Documentation

- **Coordination System**: `README-COORDINATION.md`
- **Quick Start**: `QUICKSTART.md`
- **BambiSleep Church**: `F:\CATHEDRAL\bambisleep-church\README.md`
- **TODO Status**: `F:\CATHEDRAL\bambisleep-church\TODO.md`
- **Telemetry**: `F:\CATHEDRAL\bambisleep-church\TELEMETRY.md`
- **Security**: `F:\CATHEDRAL\bambisleep-church\SECURITY.md`

---

## 🎉 Success Metrics

**After running all tasks:**
- ✅ All 25 tasks completed
- ✅ Missing files recovered
- ✅ 100% test coverage achieved
- ✅ Environment configured
- ✅ Monitoring stack deployed
- ✅ Documentation updated
- ✅ Production ready

---

## 💎 Commands Summary

```powershell
# Status check
.\handle-bambisleep-church.ps1 -Action status

# Setup coordination
.\handle-bambisleep-church.ps1 -Action setup

# Start orchestrator
.\orchestrator.ps1

# Start workers (3 terminals)
.\worker.ps1 -Role inspector
.\worker.ps1 -Role writer
.\worker.ps1 -Role tester

# Monitor progress
Watch-Progress

# Add custom task
Add-Task -Type "write" -Target "F:\output" -Description "Task name" -Priority 1
```

---

**Made with 💎 by the BambiSleep™ community**

Last Updated: 2025-11-08
