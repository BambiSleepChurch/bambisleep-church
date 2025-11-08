# Multi-Instance Copilot CLI Coordination System

A file-based task queue system for coordinating multiple Copilot CLI instances working together.

## Architecture

```
┌─────────────────┐
│  ORCHESTRATOR   │  - Creates tasks
│    (Terminal 1) │  - Monitors progress
└────────┬────────┘  - Displays status
         │
         │ Shared JSON Files (F:\.powershell\7\copilot-orchestration\)
         │
    ┌────┴─────┬────────────┬─────────────┐
    │          │            │             │
┌───▼───┐  ┌──▼────┐  ┌────▼───┐  ┌──────▼─────┐
│INSPEC │  │WRITER │  │ TESTER │  │ [CUSTOM]   │
│TOR    │  │(WSL)  │  │        │  │            │
│(Term2)│  │(Term3)│  │(Term4) │  │            │
└───────┘  └───────┘  └────────┘  └────────────┘
  Reads      Creates    Validates   Your custom
  files      files      output      role here
```

## Quick Start

### Terminal 1: Orchestrator (Current Terminal)
```powershell
cd F:\.powershell\7
.\orchestrator.ps1
```

This initializes the coordination system and creates sample tasks.

### Terminal 2: Inspector Worker
```powershell
cd F:\.powershell\7
.\worker.ps1 -Role inspector
```

Automatically picks up and processes "inspect" tasks.

### Terminal 3: Writer Worker (Great for WSL Copilot)
```powershell
cd F:\.powershell\7
.\worker.ps1 -Role writer
```

Automatically picks up and processes "write" tasks - perfect for file creation.

### Terminal 4: Tester Worker
```powershell
cd F:\.powershell\7
.\worker.ps1 -Role tester
```

Automatically picks up and processes "test" tasks.

## Coordination Files

Located in: `F:\.powershell\7\copilot-orchestration\`

- **task-queue.json** - Task queue (pending, in-progress, completed)
- **status.json** - Instance status and health monitoring
- **results.json** - Completed task results and logs
- **.queue.lock** - File lock for atomic operations (prevents race conditions)

## Task Types

| Type     | Role      | Purpose                              |
|----------|-----------|--------------------------------------|
| inspect  | Inspector | Analyze files/directories            |
| write    | Writer    | Create/modify files (perfect for AI) |
| test     | Tester    | Validate output and run tests        |

## How It Works

1. **Orchestrator** creates tasks and adds them to the queue
2. **Workers** continuously poll for tasks matching their role type
3. **File locking** prevents multiple workers from claiming the same task
4. **Status updates** provide real-time monitoring of each worker
5. **Results logging** tracks all completed tasks with outcomes

## Adding Custom Tasks

From the orchestrator terminal:

```powershell
# Source the orchestrator functions
. .\orchestrator.ps1

# Add inspection task
Add-Task -Type "inspect" -Target "F:\myproject\src" -Description "Analyze source code structure" -Priority 1

# Add write task  
Add-Task -Type "write" -Target "F:\output\api" -Description "Generate REST API module" -Priority 2

# Add test task
Add-Task -Type "test" -Target "F:\output" -Description "Validate generated code syntax" -Priority 3

# Watch real-time progress
Watch-Progress
```

## Monitoring

### View Current Status
```powershell
Show-Status
```

Shows:
- Active workers and their status
- Pending task count
- In-progress tasks
- Completed task count

### Watch Progress (Auto-Refresh Dashboard)
```powershell
Watch-Progress
```

Refreshes every 3 seconds, automatically exits when all tasks complete.

## Advanced Usage

### Priority System

Lower numbers = higher priority (tasks claimed first):
- **Priority 1**: Critical/blocking tasks
- **Priority 5**: Normal tasks (default)
- **Priority 10**: Low priority/background tasks

### Adding Custom Worker Types

1. Edit `worker.ps1` and add to `$roleTypeMap`:
```powershell
$roleTypeMap = @{
    "inspector" = "inspect"
    "writer" = "write"
    "tester" = "test"
    "deployer" = "deploy"  # Your custom type
}
```

2. Add custom task handler:
```powershell
function Invoke-DeployerTask {
    param([object]$Task)
    Write-Host "🚀 Deploying: $($Task.description)" -ForegroundColor Cyan
    # Your deployment logic here
    return "Deployed successfully"
}
```

3. Update the switch statement in worker loop:
```powershell
$result = switch ($Role) {
    "inspector" { Invoke-InspectorTask $task }
    "writer" { Invoke-WriterTask $task }
    "tester" { Invoke-TesterTask $task }
    "deployer" { Invoke-DeployerTask $task }
}
```

### Error Handling

Failed tasks are automatically:
- Marked with `success: false`
- Logged with error message in `results.json`
- Moved to completed queue (not retried by default)

## File Locking Details

Simple file-based locking with retry logic:
- **Max 50 attempts** before giving up
- **Random backoff** (50-200ms) to reduce contention
- **Automatic cleanup** when task completes
- **Ownership verification** to prevent race conditions

## Coordination Flow

```
1. Worker polls for task (every 2 seconds)
2. Worker acquires lock
3. Worker claims highest priority matching task
4. Worker releases lock
5. Worker processes task
6. Worker acquires lock again
7. Worker marks task complete
8. Worker releases lock
9. Worker updates status
10. Repeat from step 1
```

## Example: Building a Codebase

```powershell
# Terminal 1: Orchestrator
cd F:\.powershell\7
.\orchestrator.ps1

# Add tasks for a coordinated build
Add-Task -Type "inspect" -Target "F:\project" -Description "Scan project dependencies" -Priority 1
Add-Task -Type "write" -Target "F:\project\models" -Description "Generate data models" -Priority 2
Add-Task -Type "write" -Target "F:\project\api" -Description "Generate API endpoints" -Priority 3
Add-Task -Type "write" -Target "F:\project\tests" -Description "Generate test suites" -Priority 4
Add-Task -Type "test" -Target "F:\project" -Description "Run all tests" -Priority 5

Watch-Progress

# Terminal 2: Inspector (reads and analyzes)
.\worker.ps1 -Role inspector

# Terminal 3: Writer (WSL Copilot - creates files)
.\worker.ps1 -Role writer

# Terminal 4: Tester (validates output)
.\worker.ps1 -Role tester
```

## Tips & Best Practices

1. **Start orchestrator first** - initializes all coordination files
2. **Workers auto-recover** - if they crash, just restart them
3. **Multiple workers per role** - you can run 2+ writers simultaneously
4. **Ctrl+C is safe** - graceful shutdown, doesn't corrupt queue
5. **Check results.json** - detailed logs of all completed tasks
6. **Task dependencies** - use priority ordering (not automatic dependencies)

## Troubleshooting

### "Failed to acquire lock" warnings
- **Cause**: Too many workers competing for lock
- **Fix**: Reduce worker count or increase backoff time in `Get-Lock`

### Worker not claiming tasks
- **Cause**: Task type doesn't match worker role
- **Fix**: Check `task-queue.json` has tasks with correct `type` field

### Status not updating
- **Cause**: Permission issues or corrupted JSON
- **Fix**: Verify write access to copilot-orchestration folder
- **Fix**: Delete `status.json` and restart orchestrator

### Queue appears stuck
- **Cause**: Stale lock file
- **Fix**: Delete `.queue.lock` manually and restart workers

## Viewing Results

```powershell
# View completed tasks
Get-Content F:\.powershell\7\copilot-orchestration\results.json | ConvertFrom-Json | 
    Select-Object -ExpandProperty results | Format-Table

# View current queue state  
Get-Content F:\.powershell\7\copilot-orchestration\task-queue.json | ConvertFrom-Json |
    Select-Object -Property @{N='Pending';E={$_.pending.Count}}, 
                           @{N='InProgress';E={$_.inProgress.Count}},
                           @{N='Completed';E={$_.completed.Count}}
```

## Future Enhancements

- [ ] Web-based dashboard (real-time monitoring)
- [ ] Task dependencies and prerequisites
- [ ] Automatic task retry on failure
- [ ] Worker load balancing
- [ ] Remote workers via network share
- [ ] Performance metrics and timing
- [ ] Task pause/resume
- [ ] Priority elevation for stuck tasks

## Architecture Notes

This system uses **optimistic locking** with file-based coordination:
- ✅ No external dependencies (pure PowerShell)
- ✅ Works across different terminal types
- ✅ Simple to understand and debug
- ✅ Survives worker crashes
- ⚠️ Not suitable for high-frequency tasks (file I/O overhead)
- ⚠️ Best for coordinating AI assistants, not production systems
