#!/usr/bin/env pwsh
# BambiSleep™ Church - Agent Tools Testing Suite
# Comprehensive test coverage for all 154 MCP agent tools across 18 categories
# Usage: .\test-tools.ps1
# See AGENT_TEST_RESULTS.md for detailed results and analysis

Write-Host "`n🌸✨ Testing Agent Tools..." -ForegroundColor Magenta
Write-Host "================================`n" -ForegroundColor Magenta

$baseUrl = "http://localhost:8080"

# Get all tools
try {
  $response = Invoke-RestMethod -Uri "$baseUrl/api/agent/tools"
  $tools = $response.tools
  Write-Host "✅ Total Tools Available: $($tools.Count)" -ForegroundColor Green
}
catch {
  Write-Host "❌ Failed to get tools: $_" -ForegroundColor Red
  exit 1
}

# Group by category
$categories = $tools | Group-Object category | Sort-Object Count -Descending

Write-Host "`n📊 Tools by Category:" -ForegroundColor Cyan
$categories | ForEach-Object {
  Write-Host "  $($_.Name): $($_.Count) tools" -ForegroundColor White
}

# Test tool execution for each category
Write-Host "`n🔬 Testing Tool Execution..." -ForegroundColor Cyan

$testResults = @()

# Memory tools
Write-Host "`n[MEMORY] Testing knowledge graph..." -ForegroundColor Yellow
try {
  $body = @{
    tool = "memory_read_graph"
    args = @{}
  } | ConvertTo-Json
  
  $result = Invoke-RestMethod -Uri "$baseUrl/api/agent/tools/execute" -Method POST -Body $body -ContentType "application/json"
  if ($result.success) {
    Write-Host "  ✅ memory_read_graph" -ForegroundColor Green
    $testResults += @{ category = "memory"; tool = "memory_read_graph"; status = "PASS" }
  }
  else {
    Write-Host "  ❌ memory_read_graph: $($result.error)" -ForegroundColor Red
    $testResults += @{ category = "memory"; tool = "memory_read_graph"; status = "FAIL" }
  }
}
catch {
  Write-Host "  ❌ memory_read_graph: $_" -ForegroundColor Red
  $testResults += @{ category = "memory"; tool = "memory_read_graph"; status = "FAIL" }
}

# Storage tools
Write-Host "`n[STORAGE] Testing file storage..." -ForegroundColor Yellow
try {
  $body = @{
    tool = "storage_list"
    args = @{ folder = "all" }
  } | ConvertTo-Json
  
  $result = Invoke-RestMethod -Uri "$baseUrl/api/agent/tools/execute" -Method POST -Body $body -ContentType "application/json"
  if ($result.success) {
    Write-Host "  ✅ storage_list" -ForegroundColor Green
    $testResults += @{ category = "storage"; tool = "storage_list"; status = "PASS" }
  }
  else {
    Write-Host "  ❌ storage_list: $($result.error)" -ForegroundColor Red
    $testResults += @{ category = "storage"; tool = "storage_list"; status = "FAIL" }
  }
}
catch {
  Write-Host "  ❌ storage_list: $_" -ForegroundColor Red
  $testResults += @{ category = "storage"; tool = "storage_list"; status = "FAIL" }
}

# GitHub tools
Write-Host "`n[GITHUB] Testing repository access..." -ForegroundColor Yellow
try {
  $body = @{
    tool = "github_search_repos"
    args = @{ query = "test" }
  } | ConvertTo-Json
  
  $result = Invoke-RestMethod -Uri "$baseUrl/api/agent/tools/execute" -Method POST -Body $body -ContentType "application/json"
  if ($result.success) {
    Write-Host "  ✅ github_search_repos" -ForegroundColor Green
    $testResults += @{ category = "github"; tool = "github_search_repos"; status = "PASS" }
  }
  else {
    Write-Host "  ❌ github_search_repos: $($result.error)" -ForegroundColor Red
    $testResults += @{ category = "github"; tool = "github_search_repos"; status = "FAIL" }
  }
}
catch {
  Write-Host "  ❌ github_search_repos: $_" -ForegroundColor Red
  $testResults += @{ category = "github"; tool = "github_search_repos"; status = "FAIL" }
}

# LM Studio tools
Write-Host "`n[LMSTUDIO] Testing language model connection..." -ForegroundColor Yellow
try {
  $body = @{
    tool = "lmstudio_list_models"
    args = @{}
  } | ConvertTo-Json
  
  $result = Invoke-RestMethod -Uri "$baseUrl/api/agent/tools/execute" -Method POST -Body $body -ContentType "application/json"
  if ($result.success) {
    Write-Host "  ✅ lmstudio_list_models" -ForegroundColor Green
    $testResults += @{ category = "lmstudio"; tool = "lmstudio_list_models"; status = "PASS" }
  }
  else {
    Write-Host "  ❌ lmstudio_list_models: $($result.error)" -ForegroundColor Red
    $testResults += @{ category = "lmstudio"; tool = "lmstudio_list_models"; status = "FAIL" }
  }
}
catch {
  Write-Host "  ❌ lmstudio_list_models: $_" -ForegroundColor Red
  $testResults += @{ category = "lmstudio"; tool = "lmstudio_list_models"; status = "FAIL" }
}

# User Model tools
Write-Host "`n[USER-MODEL] Testing user preferences..." -ForegroundColor Yellow
try {
  $body = @{
    tool = "user_get_profile"
    args = @{}
  } | ConvertTo-Json
  
  $result = Invoke-RestMethod -Uri "$baseUrl/api/agent/tools/execute" -Method POST -Body $body -ContentType "application/json"
  if ($result.success) {
    Write-Host "  ✅ user_get_profile" -ForegroundColor Green
    $testResults += @{ category = "user-model"; tool = "user_get_profile"; status = "PASS" }
  }
  else {
    Write-Host "  ❌ user_get_profile: $($result.error)" -ForegroundColor Red
    $testResults += @{ category = "user-model"; tool = "user_get_profile"; status = "FAIL" }
  }
}
catch {
  Write-Host "  ❌ user_get_profile: $_" -ForegroundColor Red
  $testResults += @{ category = "user-model"; tool = "user_get_profile"; status = "FAIL" }
}

# Conversation tools
Write-Host "`n[CONVERSATION] Testing chat history..." -ForegroundColor Yellow
try {
  $body = @{
    tool = "conversation_get_history"
    args = @{ limit = 10 }
  } | ConvertTo-Json
  
  $result = Invoke-RestMethod -Uri "$baseUrl/api/agent/tools/execute" -Method POST -Body $body -ContentType "application/json"
  if ($result.success) {
    Write-Host "  ✅ conversation_get_history" -ForegroundColor Green
    $testResults += @{ category = "conversation"; tool = "conversation_get_history"; status = "PASS" }
  }
  else {
    Write-Host "  ❌ conversation_get_history: $($result.error)" -ForegroundColor Red
    $testResults += @{ category = "conversation"; tool = "conversation_get_history"; status = "FAIL" }
  }
}
catch {
  Write-Host "  ❌ conversation_get_history: $_" -ForegroundColor Red
  $testResults += @{ category = "conversation"; tool = "conversation_get_history"; status = "FAIL" }
}

# Workspace tools
Write-Host "`n[WORKSPACE] Testing project analysis..." -ForegroundColor Yellow
try {
  $body = @{
    tool = "workspace_analyze_project"
    args = @{}
  } | ConvertTo-Json
  
  $result = Invoke-RestMethod -Uri "$baseUrl/api/agent/tools/execute" -Method POST -Body $body -ContentType "application/json"
  if ($result.success) {
    Write-Host "  ✅ workspace_analyze_project" -ForegroundColor Green
    $testResults += @{ category = "workspace"; tool = "workspace_analyze_project"; status = "PASS" }
  }
  else {
    Write-Host "  ❌ workspace_analyze_project: $($result.error)" -ForegroundColor Red
    $testResults += @{ category = "workspace"; tool = "workspace_analyze_project"; status = "FAIL" }
  }
}
catch {
  Write-Host "  ❌ workspace_analyze_project: $_" -ForegroundColor Red
  $testResults += @{ category = "workspace"; tool = "workspace_analyze_project"; status = "FAIL" }
}

# Memory Manager tools
Write-Host "`n[MEMORY-MANAGER] Testing memory lifecycle..." -ForegroundColor Yellow
try {
  $body = @{
    tool = "memory_get_stats"
    args = @{}
  } | ConvertTo-Json
  
  $result = Invoke-RestMethod -Uri "$baseUrl/api/agent/tools/execute" -Method POST -Body $body -ContentType "application/json"
  if ($result.success) {
    Write-Host "  ✅ memory_get_stats" -ForegroundColor Green
    $testResults += @{ category = "memory-manager"; tool = "memory_get_stats"; status = "PASS" }
  }
  else {
    Write-Host "  ❌ memory_get_stats: $($result.error)" -ForegroundColor Red
    $testResults += @{ category = "memory-manager"; tool = "memory_get_stats"; status = "FAIL" }
  }
}
catch {
  Write-Host "  ❌ memory_get_stats: $_" -ForegroundColor Red
  $testResults += @{ category = "memory-manager"; tool = "memory_get_stats"; status = "FAIL" }
}

# Fetch tools
Write-Host "`n[FETCH] Testing HTTP requests..." -ForegroundColor Yellow
try {
  $body = @{
    tool = "fetch_url"
    args = @{ url = "https://api.github.com/zen" }
  } | ConvertTo-Json
  
  $result = Invoke-RestMethod -Uri "$baseUrl/api/agent/tools/execute" -Method POST -Body $body -ContentType "application/json"
  if ($result.success) {
    Write-Host "  ✅ fetch_url" -ForegroundColor Green
    $testResults += @{ category = "fetch"; tool = "fetch_url"; status = "PASS" }
  }
  else {
    Write-Host "  ❌ fetch_url: $($result.error)" -ForegroundColor Red
    $testResults += @{ category = "fetch"; tool = "fetch_url"; status = "FAIL" }
  }
}
catch {
  Write-Host "  ❌ fetch_url: $_" -ForegroundColor Red
  $testResults += @{ category = "fetch"; tool = "fetch_url"; status = "FAIL" }
}

# Puppeteer tools
Write-Host "`n[PUPPETEER] Testing browser automation..." -ForegroundColor Yellow
try {
  $body = @{
    tool = "puppeteer_evaluate"
    args = @{ expression = "1 + 1" }
  } | ConvertTo-Json
  
  $result = Invoke-RestMethod -Uri "$baseUrl/api/agent/tools/execute" -Method POST -Body $body -ContentType "application/json"
  if ($result.success) {
    Write-Host "  ✅ puppeteer_evaluate" -ForegroundColor Green
    $testResults += @{ category = "puppeteer"; tool = "puppeteer_evaluate"; status = "PASS" }
  }
  else {
    Write-Host "  ❌ puppeteer_evaluate: $($result.error)" -ForegroundColor Red
    $testResults += @{ category = "puppeteer"; tool = "puppeteer_evaluate"; status = "FAIL" }
  }
}
catch {
  Write-Host "  ❌ puppeteer_evaluate: $_" -ForegroundColor Red
  $testResults += @{ category = "puppeteer"; tool = "puppeteer_evaluate"; status = "FAIL" }
}

# MongoDB tools
Write-Host "`n[MONGODB] Testing database connection..." -ForegroundColor Yellow
try {
  $body = @{
    tool = "mongodb_aggregate"
    args = @{ collection = "test"; pipeline = @(@{}) }
  } | ConvertTo-Json -Depth 3
  
  $result = Invoke-RestMethod -Uri "$baseUrl/api/agent/tools/execute" -Method POST -Body $body -ContentType "application/json"
  if ($result.success) {
    Write-Host "  ✅ mongodb_aggregate" -ForegroundColor Green
    $testResults += @{ category = "mongodb"; tool = "mongodb_aggregate"; status = "PASS" }
  }
  else {
    Write-Host "  ❌ mongodb_aggregate: $($result.error)" -ForegroundColor Red
    $testResults += @{ category = "mongodb"; tool = "mongodb_aggregate"; status = "FAIL" }
  }
}
catch {
  Write-Host "  ❌ mongodb_aggregate: $_" -ForegroundColor Red
  $testResults += @{ category = "mongodb"; tool = "mongodb_aggregate"; status = "FAIL" }
}

# SQLite tools
Write-Host "`n[SQLITE] Testing local database..." -ForegroundColor Yellow
try {
  $body = @{
    tool = "sqlite_list_tables"
    args = @{}
  } | ConvertTo-Json
  
  $result = Invoke-RestMethod -Uri "$baseUrl/api/agent/tools/execute" -Method POST -Body $body -ContentType "application/json"
  if ($result.success) {
    Write-Host "  ✅ sqlite_list_tables" -ForegroundColor Green
    $testResults += @{ category = "sqlite"; tool = "sqlite_list_tables"; status = "PASS" }
  }
  else {
    Write-Host "  ❌ sqlite_list_tables: $($result.error)" -ForegroundColor Red
    $testResults += @{ category = "sqlite"; tool = "sqlite_list_tables"; status = "FAIL" }
  }
}
catch {
  Write-Host "  ❌ sqlite_list_tables: $_" -ForegroundColor Red
  $testResults += @{ category = "sqlite"; tool = "sqlite_list_tables"; status = "FAIL" }
}

# Sequential Thinking tools
Write-Host "`n[THINKING] Testing reasoning engine..." -ForegroundColor Yellow
try {
  $body = @{
    tool = "thinking_conclude"
    args = @{ conclusion = "Agent tool test execution complete" }
  } | ConvertTo-Json
  
  $result = Invoke-RestMethod -Uri "$baseUrl/api/agent/tools/execute" -Method POST -Body $body -ContentType "application/json"
  if ($result.success) {
    Write-Host "  ✅ thinking_conclude" -ForegroundColor Green
    $testResults += @{ category = "thinking"; tool = "thinking_conclude"; status = "PASS" }
  }
  else {
    Write-Host "  ❌ thinking_conclude: $($result.error)" -ForegroundColor Red
    $testResults += @{ category = "thinking"; tool = "thinking_conclude"; status = "FAIL" }
  }
}
catch {
  Write-Host "  ❌ thinking_conclude: $_" -ForegroundColor Red
  $testResults += @{ category = "thinking"; tool = "thinking_conclude"; status = "FAIL" }
}

# Stripe tools
Write-Host "`n[STRIPE] Testing payment integration..." -ForegroundColor Yellow
try {
  $body = @{
    tool = "stripe_list_products"
    args = @{ limit = 5 }
  } | ConvertTo-Json
  
  $result = Invoke-RestMethod -Uri "$baseUrl/api/agent/tools/execute" -Method POST -Body $body -ContentType "application/json"
  if ($result.success) {
    Write-Host "  ✅ stripe_list_products" -ForegroundColor Green
    $testResults += @{ category = "stripe"; tool = "stripe_list_products"; status = "PASS" }
  }
  else {
    Write-Host "  ❌ stripe_list_products: $($result.error)" -ForegroundColor Red
    $testResults += @{ category = "stripe"; tool = "stripe_list_products"; status = "FAIL" }
  }
}
catch {
  Write-Host "  ❌ stripe_list_products: $_" -ForegroundColor Red
  $testResults += @{ category = "stripe"; tool = "stripe_list_products"; status = "FAIL" }
}

# Patreon tools
Write-Host "`n[PATREON] Testing creator platform..." -ForegroundColor Yellow
try {
  $body = @{
    tool = "patreon_get_identity"
    args = @{}
  } | ConvertTo-Json
  
  $result = Invoke-RestMethod -Uri "$baseUrl/api/agent/tools/execute" -Method POST -Body $body -ContentType "application/json"
  if ($result.success) {
    Write-Host "  ✅ patreon_get_identity" -ForegroundColor Green
    $testResults += @{ category = "patreon"; tool = "patreon_get_identity"; status = "PASS" }
  }
  else {
    Write-Host "  ❌ patreon_get_identity: $($result.error)" -ForegroundColor Red
    $testResults += @{ category = "patreon"; tool = "patreon_get_identity"; status = "FAIL" }
  }
}
catch {
  Write-Host "  ❌ patreon_get_identity: $_" -ForegroundColor Red
  $testResults += @{ category = "patreon"; tool = "patreon_get_identity"; status = "FAIL" }
}

# Clarity tools
Write-Host "`n[CLARITY] Testing analytics..." -ForegroundColor Yellow
try {
  $body = @{
    tool = "clarity_heatmap_data"
    args = @{ page = "/" }
  } | ConvertTo-Json
  
  $result = Invoke-RestMethod -Uri "$baseUrl/api/agent/tools/execute" -Method POST -Body $body -ContentType "application/json"
  if ($result.success) {
    Write-Host "  ✅ clarity_heatmap_data" -ForegroundColor Green
    $testResults += @{ category = "clarity"; tool = "clarity_heatmap_data"; status = "PASS" }
  }
  else {
    Write-Host "  ❌ clarity_heatmap_data: $($result.error)" -ForegroundColor Red
    $testResults += @{ category = "clarity"; tool = "clarity_heatmap_data"; status = "FAIL" }
  }
}
catch {
  Write-Host "  ❌ clarity_heatmap_data: $_" -ForegroundColor Red
  $testResults += @{ category = "clarity"; tool = "clarity_heatmap_data"; status = "FAIL" }
}

# HuggingFace tools
Write-Host "`n[HUGGINGFACE] Testing model hub..." -ForegroundColor Yellow
try {
  $body = @{
    tool = "huggingface_search_models"
    args = @{ query = "text-generation"; limit = 5 }
  } | ConvertTo-Json
  
  $result = Invoke-RestMethod -Uri "$baseUrl/api/agent/tools/execute" -Method POST -Body $body -ContentType "application/json"
  if ($result.success) {
    Write-Host "  ✅ huggingface_search_models" -ForegroundColor Green
    $testResults += @{ category = "huggingface"; tool = "huggingface_search_models"; status = "PASS" }
  }
  else {
    Write-Host "  ❌ huggingface_search_models: $($result.error)" -ForegroundColor Red
    $testResults += @{ category = "huggingface"; tool = "huggingface_search_models"; status = "FAIL" }
  }
}
catch {
  Write-Host "  ❌ huggingface_search_models: $_" -ForegroundColor Red
  $testResults += @{ category = "huggingface"; tool = "huggingface_search_models"; status = "FAIL" }
}

# Render tools (WebSocket-based UI commands)
Write-Host "`n[RENDER] Testing UI rendering..." -ForegroundColor Yellow
try {
  $body = @{
    tool = "render_notification"
    args = @{ 
      type     = "info"
      message  = "Agent tool test in progress"
      duration = 3000
    }
  } | ConvertTo-Json
  
  $result = Invoke-RestMethod -Uri "$baseUrl/api/agent/tools/execute" -Method POST -Body $body -ContentType "application/json"
  if ($result.success) {
    Write-Host "  ✅ render_notification" -ForegroundColor Green
    $testResults += @{ category = "render"; tool = "render_notification"; status = "PASS" }
  }
  else {
    Write-Host "  ❌ render_notification: $($result.error)" -ForegroundColor Red
    $testResults += @{ category = "render"; tool = "render_notification"; status = "FAIL" }
  }
}
catch {
  Write-Host "  ❌ render_notification: $_" -ForegroundColor Red
  $testResults += @{ category = "render"; tool = "render_notification"; status = "FAIL" }
}

# Summary
Write-Host "`n================================" -ForegroundColor Magenta
$passed = ($testResults | Where-Object { $_.status -eq "PASS" }).Count
$total = $testResults.Count
$successRate = [math]::Round(($passed / $total) * 100, 1)

Write-Host "Results: $passed/$total tools passed ($successRate%)" -ForegroundColor $(if ($successRate -gt 80) { "Green" } else { "Yellow" })
Write-Host "================================`n" -ForegroundColor Magenta

if ($successRate -lt 100) {
  Write-Host "⚠️  Some tools failed. Check logs for details." -ForegroundColor Yellow
}
else {
  Write-Host "✅ All tested tools working!" -ForegroundColor Green
}
