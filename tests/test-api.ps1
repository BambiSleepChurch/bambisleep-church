#!/usr/bin/env pwsh
# BambiSleep™ Church - API Endpoint Testing Suite
# Tests all REST API endpoints for availability and response codes
# Usage: .\test-api.ps1

$base = "http://localhost:8080"

Write-Host "`nTesting API Endpoints..." -ForegroundColor Cyan

# Core
$tests = @(
    @{Name="Health"; Url="$base/api/health"},
    @{Name="Servers"; Url="$base/api/servers"},
    @{Name="Metrics"; Url="$base/api/metrics"},
    @{Name="Agent Tools"; Url="$base/api/agent/tools"},
    @{Name="Memory Graph"; Url="$base/api/memory"},
    @{Name="GitHub User"; Url="$base/api/github/user"},
    @{Name="Storage Files"; Url="$base/api/storage/files"},
    @{Name="LM Studio Status"; Url="$base/api/lmstudio/status"},
    @{Name="LM Studio Models"; Url="$base/api/lmstudio/models"},
    @{Name="Patreon Identity"; Url="$base/api/patreon/identity"},
    @{Name="Patreon Campaigns"; Url="$base/api/patreon/campaigns"},
    @{Name="BambiSleep Triggers"; Url="$base/api/bambisleep/triggers"},
    @{Name="BambiSleep Spirals"; Url="$base/api/bambisleep/spirals"},
    @{Name="BambiSleep Voices"; Url="$base/api/bambisleep/voices"},
    @{Name="Clarity Dashboard"; Url="$base/api/clarity/dashboard"},
    @{Name="Puppeteer Status"; Url="$base/api/puppeteer/status"}
)

$passed = 0
$failed = 0

foreach ($test in $tests) {
    Write-Host "`n[$($test.Name)]" -ForegroundColor White
    try {
        $response = Invoke-WebRequest -Uri $test.Url -UseBasicParsing -ErrorAction Stop
        Write-Host "  PASS ($($response.StatusCode))" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "  FAIL: $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "Results: $passed passed, $failed failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Yellow" })
Write-Host "======================================`n" -ForegroundColor Cyan
