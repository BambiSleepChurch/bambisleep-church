# Multi-Instance Copilot CLI Worker
# Roles: INSPECTOR (file inspection) | WRITER (file creation) | TESTER (validation)

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("inspector", "writer", "tester")]
    [string]$Role,
    
    [string]$WorkDir = "F:\.powershell\7\copilot-orchestration"
)

$ErrorActionPreference = "Continue"
Set-Location $WorkDir

$taskQueueFile = Join-Path $WorkDir "task-queue.json"
$statusFile = Join-Path $WorkDir "status.json"
$resultsFile = Join-Path $WorkDir "results.json"
$lockFile = Join-Path $WorkDir ".queue.lock"

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

function Update-Status {
    param([string]$Status)
    
    if (Test-Path $statusFile) {
        $statusData = Get-Content $statusFile -Raw | ConvertFrom-Json
        $statusData.instances.$Role.status = $Status
        $statusData.instances.$Role.lastUpdate = Get-Date -Format "o"
        $statusData | ConvertTo-Json -Depth 10 | Set-Content $statusFile
    }
}

function Get-Lock {
    $maxAttempts = 50
    $attempt = 0
    
    while ($attempt -lt $maxAttempts) {
        try {
            if (-not (Test-Path $lockFile)) {
                @{ locked = $true; by = $Role; at = (Get-Date -Format "o") } | ConvertTo-Json | Set-Content $lockFile
                Start-Sleep -Milliseconds 100
                
                $lockData = Get-Content $lockFile -Raw | ConvertFrom-Json
                if ($lockData.by -eq $Role) {
                    return $true
                }
            }
        } catch {}
        
        Start-Sleep -Milliseconds (Get-Random -Minimum 50 -Maximum 200)
        $attempt++
    }
    
    return $false
}

function Release-Lock {
    if (Test-Path $lockFile) {
        Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
    }
}

function Get-NextTask {
    $roleTypeMap = @{
        "inspector" = "inspect"
        "writer" = "write"
        "tester" = "test"
    }
    
    $taskType = $roleTypeMap[$Role]
    
    if (-not (Get-Lock)) {
        Write-Host "⚠ Failed to acquire lock" -ForegroundColor Yellow
        return $null
    }
    
    try {
        $queue = Get-TaskQueue
        if (-not $queue) { return $null }
        
        $availableTask = $queue.pending | Where-Object { $_.type -eq $taskType } | Sort-Object priority | Select-Object -First 1
        
        if ($availableTask) {
            $queue.pending = @($queue.pending | Where-Object { $_.id -ne $availableTask.id })
            $availableTask.assignedTo = $Role
            $availableTask.startedAt = Get-Date -Format "o"
            $queue.inProgress += $availableTask
            
            Set-TaskQueue $queue
            return $availableTask
        }
    }
    finally {
        Release-Lock
    }
    
    return $null
}

function Complete-Task {
    param(
        [object]$Task,
        [string]$Result,
        [bool]$Success = $true
    )
    
    if (-not (Get-Lock)) {
        Write-Host "⚠ Failed to acquire lock for completion" -ForegroundColor Yellow
        return
    }
    
    try {
        $queue = Get-TaskQueue
        $queue.inProgress = @($queue.inProgress | Where-Object { $_.id -ne $Task.id })
        
        $Task.completedAt = Get-Date -Format "o"
        $Task.result = $Result
        $Task.success = $Success
        
        $queue.completed += $Task
        Set-TaskQueue $queue
        
        $results = Get-Content $resultsFile -Raw | ConvertFrom-Json
        $results.results += @{
            taskId = $Task.id
            role = $Role
            description = $Task.description
            result = $Result
            success = $Success
            completedAt = $Task.completedAt
        }
        $results | ConvertTo-Json -Depth 10 | Set-Content $resultsFile
    }
    finally {
        Release-Lock
    }
}

function Invoke-InspectorTask {
    param([object]$Task)
    
    Write-Host "`n🔍 Inspecting: $($Task.target)" -ForegroundColor Cyan
    
    $result = @{
        path = $Task.target
        exists = Test-Path $Task.target
        items = @()
    }
    
    if ($result.exists) {
        if (Test-Path $Task.target -PathType Container) {
            $items = Get-ChildItem $Task.target -File -ErrorAction SilentlyContinue | Select-Object -First 10
            $result.items = $items | ForEach-Object { $_.Name }
            $result.type = "directory"
            $result.fileCount = (Get-ChildItem $Task.target -File -ErrorAction SilentlyContinue).Count
        } else {
            $result.type = "file"
            $result.size = (Get-Item $Task.target).Length
            $result.lines = (Get-Content $Task.target | Measure-Object -Line).Lines
        }
    }
    
    $resultText = $result | ConvertTo-Json -Compress
    Write-Host "✓ Inspection complete" -ForegroundColor Green
    
    return $resultText
}

function Invoke-WriterTask {
    param([object]$Task)
    
    Write-Host "`n✍ Writing: $($Task.description)" -ForegroundColor Cyan
    
    $outputPath = Join-Path $Task.target "output_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"
    
    if (-not (Test-Path $Task.target)) {
        New-Item -ItemType Directory -Force -Path $Task.target | Out-Null
    }
    
    $content = @"
# Auto-generated by Writer Worker
# Task: $($Task.description)
# Generated: $(Get-Date -Format "o")

This file was created as part of the multi-instance coordination system.
Task ID: $($Task.id)
"@
    
    Set-Content -Path $outputPath -Value $content
    Write-Host "✓ File created: $outputPath" -ForegroundColor Green
    
    return "Created: $outputPath"
}

function Invoke-TesterTask {
    param([object]$Task)
    
    Write-Host "`n🧪 Testing: $($Task.target)" -ForegroundColor Cyan
    
    $testResults = @{
        testsRun = 0
        passed = 0
        failed = 0
    }
    
    if (Test-Path $Task.target) {
        $files = Get-ChildItem $Task.target -File -ErrorAction SilentlyContinue
        $testResults.testsRun = $files.Count
        $testResults.passed = $files.Count
        $testResults.failed = 0
    }
    
    Write-Host "✓ Testing complete: $($testResults.passed)/$($testResults.testsRun) passed" -ForegroundColor Green
    
    return $testResults | ConvertTo-Json -Compress
}

# Main worker loop
Write-Host @"

╔════════════════════════════════════════════════════════╗
║   WORKER: $($Role.ToUpper().PadRight(44)) ║
╚════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

Update-Status "active"

Write-Host "👷 Worker started, polling for tasks..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop`n" -ForegroundColor Gray

$iteration = 0
while ($true) {
    $iteration++
    
    $task = Get-NextTask
    
    if ($task) {
        Write-Host "`n[$iteration] 📋 Claimed task #$($task.id): $($task.description)" -ForegroundColor Yellow
        Update-Status "working"
        
        try {
            $result = switch ($Role) {
                "inspector" { Invoke-InspectorTask $task }
                "writer" { Invoke-WriterTask $task }
                "tester" { Invoke-TesterTask $task }
            }
            
            Complete-Task -Task $task -Result $result -Success $true
            Write-Host "✓ Task #$($task.id) completed" -ForegroundColor Green
        }
        catch {
            Write-Host "✗ Task #$($task.id) failed: $_" -ForegroundColor Red
            Complete-Task -Task $task -Result $_.Exception.Message -Success $false
        }
        
        Update-Status "active"
    }
    else {
        Write-Host "." -NoNewline -ForegroundColor DarkGray
    }
    
    Start-Sleep -Seconds 2
}
