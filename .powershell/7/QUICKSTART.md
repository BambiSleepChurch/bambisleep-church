# Quick Start Guide - Multi-Instance Copilot CLI Coordination

## ✅ System Created Successfully!

Three files have been created in `F:\.powershell\7`:
1. **orchestrator.ps1** - Main coordinator
2. **worker.ps1** - Worker script (runs in multiple instances)
3. **README-COORDINATION.md** - Full documentation

---

## 🚀 QUICK START (Copy these commands)

### Current Terminal (Terminal 1) - ORCHESTRATOR
```powershell
cd F:\.powershell\7
.\orchestrator.ps1
```

### Terminal 2 - INSPECTOR (File Analysis)
Open a **new** Copilot CLI terminal and run:
```powershell
cd F:\.powershell\7
.\worker.ps1 -Role inspector
```

### Terminal 3 - WRITER (File Creation - WSL)
Open **another** Copilot CLI terminal (WSL recommended) and run:
```powershell
cd F:\.powershell\7
.\worker.ps1 -Role writer
```

### Terminal 4 - TESTER (Validation)
Open **one more** Copilot CLI terminal and run:
```powershell
cd F:\.powershell\7
.\worker.ps1 -Role tester
```

---

## 📊 How It Works

```
Terminal 1 (YOU)        → Creates tasks, monitors progress
    ↓
Shared JSON Files       → task-queue.json, status.json, results.json
    ↓
Terminal 2, 3, 4        → Auto-claim and process tasks
```

### The Flow:
1. **Orchestrator** initializes with 5 sample tasks
2. **Workers** automatically claim tasks matching their role
3. **Inspector** analyzes files/directories
4. **Writer** creates files (perfect for AI-generated code)
5. **Tester** validates output
6. **Results** logged to `results.json`

---

## 💡 Example: Custom Tasks

Once the orchestrator is running, you can add your own tasks:

```powershell
# In Terminal 1 (Orchestrator), after it starts:

# Load functions
. .\orchestrator.ps1

# Add inspection task
Add-Task -Type "inspect" -Target "F:\myproject" -Description "Analyze codebase structure" -Priority 1

# Add write task (will be picked up by Terminal 3 - Writer)
Add-Task -Type "write" -Target "F:\output\api" -Description "Generate REST API endpoints" -Priority 2

# Add test task
Add-Task -Type "test" -Target "F:\output" -Description "Validate generated files" -Priority 3

# Watch progress in real-time
Watch-Progress
```

---

## 🎯 Best Practices

### Role Assignment:
- **Terminal 1 (Orchestrator)** - You interact here, add tasks, monitor
- **Terminal 2 (Inspector)** - Best Copilot: Code analysis expert
- **Terminal 3 (Writer)** - **WSL Copilot recommended** - File creation
- **Terminal 4 (Tester)** - Validation and testing

### Coordination Pattern:
1. Orchestrator adds **inspect** task → Inspector claims it
2. Inspector results inform next steps
3. Orchestrator adds **write** tasks → Writer claims them
4. Writer creates files → Tester validates
5. Results logged, visible in real-time

---

## 📁 Generated Files Location

All coordination data: `F:\.powershell\7\copilot-orchestration\`
- `task-queue.json` - Current queue state
- `status.json` - Worker health/status
- `results.json` - Completed task results
- `.queue.lock` - Temporary lock file

---

## 🔧 Common Commands

### In Orchestrator Terminal:
```powershell
# View current status
Show-Status

# Add new task
Add-Task -Type "write" -Target "F:\output" -Description "Create module"

# Watch real-time progress
Watch-Progress

# View results
Get-Content F:\.powershell\7\copilot-orchestration\results.json | ConvertFrom-Json
```

### Worker Terminals:
Just let them run! They auto-poll every 2 seconds.
- Press `Ctrl+C` to stop a worker safely

---

## 🐛 Troubleshooting

**Workers not claiming tasks?**
- Ensure orchestrator ran first (creates coordination files)
- Check task type matches worker role

**Lock timeouts?**
- Delete `F:\.powershell\7\copilot-orchestration\.queue.lock`
- Reduce number of workers

**Want to reset?**
- Delete `F:\.powershell\7\copilot-orchestration` folder
- Run orchestrator again

---

## 📖 Full Documentation

See `README-COORDINATION.md` for:
- Architecture diagrams
- Advanced customization
- Adding custom worker types
- Error handling details
- Performance tips

---

## 🎉 Ready to Go!

**Run this NOW in your current terminal:**
```powershell
cd F:\.powershell\7
.\orchestrator.ps1
```

Then open 3 more terminals and run the worker commands above.

**Watch the magic happen as tasks get claimed and processed automatically!** ✨
