# Multi-Instance Copilot CLI Orchestrator
# Role: ORCHESTRATOR - Manages task distribution and monitors progress

param(
    [string]$ProjectName = "MyProject",
    [string]$WorkDir = "F:\.powershell\7\copilot-orchestration"
)

$ErrorActionPreference = "Continue"

# Create work directory if needed
if (-not (Test-Path $WorkDir)) {
    New-Item -ItemType Directory -Force -Path $WorkDir | Out-Null
}

Set-Location $WorkDir

# Initialize coordination files
$taskQueueFile = Join-Path $WorkDir "task-queue.json"
$statusFile = Join-Path $WorkDir "status.json"
$resultsFile = Join-Path $WorkDir "results.json"

function Initialize-Coordination {
    $initialStatus = @{
        project = $ProjectName
        started = (Get-Date -Format "o")
        instances = @{
            orchestrator = @{ role = "orchestrator"; status = "active"; lastUpdate = (Get-Date -Format "o") }
            inspector = @{ role = "inspector"; status = "waiting"; lastUpdate = (Get-Date -Format "o") }
            writer = @{ role = "writer"; status = "waiting"; lastUpdate = (Get-Date -Format "o") }
            tester = @{ role = "tester"; status = "waiting"; lastUpdate = (Get-Date -Format "o") }
        }
    }
    
    $initialQueue = @{
        pending = @(
            @{ id = 1; type = "inspect"; target = "F:\"; description = "Analyze project structure"; assignedTo = $null; priority = 1 }
            @{ id = 2; type = "inspect"; target = "F:\src"; description = "Inspect source files"; assignedTo = $null; priority = 2 }
            @{ id = 3; type = "write"; target = "F:\output"; description = "Create API module"; assignedTo = $null; priority = 3 }
            @{ id = 4; type = "write"; target = "F:\output"; description = "Create utility functions"; assignedTo = $null; priority = 4 }
            @{ id = 5; type = "test"; target = "F:\output"; description = "Run unit tests"; assignedTo = $null; priority = 5 }
        )
        inProgress = @()
        completed = @()
    }
    
    $initialResults = @{
        results = @()
    }
    
    $initialStatus | ConvertTo-Json -Depth 10 | Set-Content $statusFile
    $initialQueue | ConvertTo-Json -Depth 10 | Set-Content $taskQueueFile
    $initialResults | ConvertTo-Json -Depth 10 | Set-Content $resultsFile
    
    Write-Host "✓ Coordination system initialized" -ForegroundColor Green
}

function Get-TaskQueue {
    if (Test-Path $taskQueueFile) {
        return Get-Content $taskQueueFile -Raw | ConvertFrom-Json
    }
    return $null
}

function Set-TaskQueue {
    param($Queue)
    $Queue | ConvertTo-Json -Depth 10 | Set-Content $taskQueueFile
}

function Show-Status {
    Write-Host "`n=== ORCHESTRATOR STATUS ===" -ForegroundColor Cyan
    
    $status = Get-Content $statusFile -Raw | ConvertFrom-Json
    $queue = Get-TaskQueue
    
    Write-Host "`nProject: $($status.project)" -ForegroundColor White
    Write-Host "Started: $($status.started)" -ForegroundColor Gray
    
    Write-Host "`nInstances:" -ForegroundColor Yellow
    foreach ($instance in $status.instances.PSObject.Properties) {
        $i = $instance.Value
        $color = if ($i.status -eq "active") { "Green" } elseif ($i.status -eq "working") { "Cyan" } else { "Gray" }
        Write-Host "  $($instance.Name): $($i.role) [$($i.status)]" -ForegroundColor $color
    }
    
    Write-Host "`nTask Queue:" -ForegroundColor Yellow
    Write-Host "  Pending: $($queue.pending.Count)" -ForegroundColor White
    Write-Host "  In Progress: $($queue.inProgress.Count)" -ForegroundColor Cyan
    Write-Host "  Completed: $($queue.completed.Count)" -ForegroundColor Green
    
    if ($queue.inProgress.Count -gt 0) {
        Write-Host "`nCurrent Tasks:" -ForegroundColor Yellow
        foreach ($task in $queue.inProgress) {
            Write-Host "  [$($task.id)] $($task.description) - Assigned to: $($task.assignedTo)" -ForegroundColor Cyan
        }
    }
}

function Watch-Progress {
    Write-Host "`n👀 Monitoring worker progress... (Ctrl+C to stop)" -ForegroundColor Cyan
    
    while ($true) {
        Clear-Host
        Show-Status
        
        $queue = Get-TaskQueue
        if ($queue.pending.Count -eq 0 -and $queue.inProgress.Count -eq 0) {
            Write-Host "`n✓ All tasks completed!" -ForegroundColor Green
            break
        }
        
        Start-Sleep -Seconds 3
    }
}

function Add-Task {
    param(
        [string]$Type,
        [string]$Target,
        [string]$Description,
        [int]$Priority = 5
    )
    
    $queue = Get-TaskQueue
    $newId = ($queue.pending + $queue.inProgress + $queue.completed | Measure-Object -Property id -Maximum).Maximum + 1
    
    $newTask = @{
        id = $newId
        type = $Type
        target = $Target
        description = $Description
        assignedTo = $null
        priority = $Priority
        created = (Get-Date -Format "o")
    }
    
    $queue.pending += $newTask
    Set-TaskQueue $queue
    
    Write-Host "✓ Added task #$newId: $Description" -ForegroundColor Green
}

# Main execution
Write-Host @"

╔════════════════════════════════════════════════════════╗
║   COPILOT CLI ORCHESTRATOR                             ║
║   Multi-Instance Coordination System                   ║
╚════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

Initialize-Coordination

Write-Host "`n📋 Commands available:" -ForegroundColor Yellow
Write-Host "  Watch progress: " -NoNewline -ForegroundColor Gray
Write-Host "Watch-Progress" -ForegroundColor White
Write-Host "  Add task: " -NoNewline -ForegroundColor Gray
Write-Host "Add-Task -Type 'write' -Target 'F:\output' -Description 'Create new file'" -ForegroundColor White
Write-Host "  View status: " -NoNewline -ForegroundColor Gray
Write-Host "Show-Status" -ForegroundColor White

Show-Status

Write-Host "`n✓ Ready! Start worker instances in other terminals" -ForegroundColor Green
Write-Host "`nCopy/paste these commands into your other Copilot CLI terminals:" -ForegroundColor Yellow
Write-Host "  Inspector: " -NoNewline -ForegroundColor Gray
Write-Host "cd F:\.powershell\7 ; .\worker.ps1 -Role inspector" -ForegroundColor Cyan
Write-Host "  Writer (WSL): " -NoNewline -ForegroundColor Gray
Write-Host "cd F:\.powershell\7 ; .\worker.ps1 -Role writer" -ForegroundColor Cyan
Write-Host "  Tester: " -NoNewline -ForegroundColor Gray
Write-Host "cd F:\.powershell\7 ; .\worker.ps1 -Role tester" -ForegroundColor Cyan
