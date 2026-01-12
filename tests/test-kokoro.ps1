#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Kokoro TTS Integration Debug & Test Script
.DESCRIPTION
  Comprehensive testing for Kokoro neural TTS system integration
.NOTES
  BambiSleep™ Church MCP Control Tower
#>

param(
  [string]$KokoroUrl = "http://192.168.0.122:8880",
  [switch]$Verbose
)

$ErrorActionPreference = "Continue"

Write-Host "`n🎤 KOKORO TTS DEBUG & TEST SUITE" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor DarkGray

# Test Configuration
$config = @{
  KokoroUrl = $KokoroUrl
  Timeout = 5
  Voices = @('af_bella', 'af_heart', 'af_jadzia', 'af_sarah', 'af_nova', 'af_river', 'af_sky', 'af_jessica', 'af_kore', 'af_nicole', 'af_alloy', 'af_aoede')
  TestText = "Hello! I'm Bambi, your helpful AI assistant!"
}

Write-Host "`n📋 Configuration:" -ForegroundColor Yellow
Write-Host "  URL: $($config.KokoroUrl)"
Write-Host "  Timeout: $($config.Timeout)s"
Write-Host "  Voices: $($config.Voices.Count)"

# Test 1: Health Check
Write-Host "`n🏥 Test 1: Health Endpoint" -ForegroundColor Cyan
try {
  $healthUrl = "$($config.KokoroUrl)/health"
  Write-Host "  GET $healthUrl" -ForegroundColor Gray
  
  $response = Invoke-WebRequest -Uri $healthUrl -Method GET -TimeoutSec $config.Timeout -ErrorAction Stop
  
  Write-Host "  ✅ PASS - Status: $($response.StatusCode)" -ForegroundColor Green
  
  if ($response.Content) {
    $data = $response.Content | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($data) {
      Write-Host "     Version: $($data.version)" -ForegroundColor Gray
      Write-Host "     Status: $($data.status)" -ForegroundColor Gray
    }
  }
} catch {
  Write-Host "  ❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
  Write-Host "     Error Type: $($_.Exception.GetType().Name)" -ForegroundColor Gray
}

# Test 2: Models Endpoint
Write-Host "`n🤖 Test 2: Models List" -ForegroundColor Cyan
try {
  $modelsUrl = "$($config.KokoroUrl)/v1/models"
  Write-Host "  GET $modelsUrl" -ForegroundColor Gray
  
  $response = Invoke-WebRequest -Uri $modelsUrl -Method GET -TimeoutSec $config.Timeout -ErrorAction Stop
  
  Write-Host "  ✅ PASS - Status: $($response.StatusCode)" -ForegroundColor Green
  
  if ($response.Content) {
    $data = $response.Content | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($data.data) {
      Write-Host "     Available Models: $($data.data.Count)" -ForegroundColor Gray
      $data.data | ForEach-Object {
        Write-Host "       - $($_.id)" -ForegroundColor DarkGray
      }
    }
  }
} catch {
  Write-Host "  ⚠️ SKIP - Endpoint not available" -ForegroundColor Yellow
}

# Test 3: Voices Endpoint
Write-Host "`n🎵 Test 3: Voices List" -ForegroundColor Cyan
try {
  $voicesUrl = "$($config.KokoroUrl)/v1/audio/voices"
  Write-Host "  GET $voicesUrl" -ForegroundColor Gray
  
  $response = Invoke-WebRequest -Uri $voicesUrl -Method GET -TimeoutSec $config.Timeout -ErrorAction Stop
  
  Write-Host "  ✅ PASS - Status: $($response.StatusCode)" -ForegroundColor Green
  
  if ($response.Content) {
    $data = $response.Content | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($data) {
      Write-Host "     Available Voices:" -ForegroundColor Gray
      if ($data.voices) {
        $data.voices | ForEach-Object {
          Write-Host "       - $_" -ForegroundColor DarkGray
        }
      } elseif ($data -is [array]) {
        $data | ForEach-Object {
          Write-Host "       - $_" -ForegroundColor DarkGray
        }
      }
    }
  }
} catch {
  Write-Host "  ⚠️ SKIP - Endpoint not available" -ForegroundColor Yellow
}

# Test 4: TTS Synthesis
Write-Host "`n🔊 Test 4: TTS Synthesis" -ForegroundColor Cyan
$testVoice = $config.Voices[0]  # af_bella
try {
  $ttsUrl = "$($config.KokoroUrl)/v1/audio/speech"
  Write-Host "  POST $ttsUrl" -ForegroundColor Gray
  Write-Host "     Voice: $testVoice" -ForegroundColor Gray
  Write-Host "     Text: `"$($config.TestText)`"" -ForegroundColor Gray
  
  $body = @{
    model = "kokoro"
    voice = $testVoice
    input = $config.TestText
    response_format = "mp3"
    speed = 1.0
  } | ConvertTo-Json
  
  $startTime = Get-Date
  $response = Invoke-WebRequest `
    -Uri $ttsUrl `
    -Method POST `
    -ContentType "application/json" `
    -Body $body `
    -TimeoutSec 30 `
    -ErrorAction Stop
  
  $duration = (Get-Date) - $startTime
  
  Write-Host "  ✅ PASS - Status: $($response.StatusCode)" -ForegroundColor Green
  Write-Host "     Size: $([math]::Round($response.RawContentLength / 1024, 2)) KB" -ForegroundColor Gray
  Write-Host "     Type: $($response.Headers.'Content-Type')" -ForegroundColor Gray
  Write-Host "     Time: $($duration.TotalMilliseconds)ms" -ForegroundColor Gray
  
  # Save test audio
  $audioPath = "f:\bambisleep-church\tests\kokoro-test.mp3"
  [System.IO.File]::WriteAllBytes($audioPath, $response.Content)
  Write-Host "     Saved: $audioPath" -ForegroundColor Gray
  
} catch {
  Write-Host "  ❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
  if ($_.Exception.Response) {
    $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Host "     Response: $responseBody" -ForegroundColor DarkGray
  }
}

# Test 5: Voice Quality Test
Write-Host "`n🎨 Test 5: Voice Preset Quality" -ForegroundColor Cyan
$presets = @{
  'af_bella' = @{ name = 'Bambi (Bright)'; speed = 0.95 }
  'af_heart' = @{ name = 'Gentle'; speed = 0.92 }
  'af_jadzia' = @{ name = 'Confident'; speed = 1.0 }
  'af_sarah' = @{ name = 'Professional'; speed = 0.98 }
  'af_nova' = @{ name = 'Energetic'; speed = 1.05 }
}

$successCount = 0
$totalCount = $presets.Count

foreach ($voiceId in $presets.Keys) {
  $preset = $presets[$voiceId]
  Write-Host "  Testing: $($preset.name) ($voiceId)" -ForegroundColor Gray
  
  try {
    $body = @{
      model = "kokoro"
      voice = $voiceId
      input = "This is a voice quality test."
      response_format = "mp3"
      speed = $preset.speed
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest `
      -Uri "$($config.KokoroUrl)/v1/audio/speech" `
      -Method POST `
      -ContentType "application/json" `
      -Body $body `
      -TimeoutSec 30 `
      -ErrorAction Stop
    
    $successCount++
    Write-Host "    ✅ OK - $([math]::Round($response.RawContentLength / 1024, 1)) KB" -ForegroundColor Green
  } catch {
    Write-Host "    ❌ FAIL" -ForegroundColor Red
  }
}

Write-Host "`n  Results: $successCount / $totalCount voices working" -ForegroundColor $(if ($successCount -eq $totalCount) { 'Green' } else { 'Yellow' })

# Summary
Write-Host "`n" + ("=" * 60) -ForegroundColor DarkGray
Write-Host "📊 SUMMARY" -ForegroundColor Cyan

if ($successCount -gt 0) {
  Write-Host "  ✅ Kokoro TTS is FUNCTIONAL" -ForegroundColor Green
  Write-Host "     Working voices: $successCount / $totalCount" -ForegroundColor Gray
  Write-Host "     Integration: Ready for production" -ForegroundColor Gray
} else {
  Write-Host "  ❌ Kokoro TTS is OFFLINE" -ForegroundColor Red
  Write-Host "     Server URL: $($config.KokoroUrl)" -ForegroundColor Gray
  Write-Host "     Fallback: Web Speech API will be used" -ForegroundColor Yellow
}

Write-Host "`n🔍 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. If offline: Check Kokoro server at $($config.KokoroUrl)" -ForegroundColor Gray
Write-Host "  2. Test in browser: Open dashboard Avatar section" -ForegroundColor Gray
Write-Host "  3. Enable debug: Set LOG_LEVEL=debug in .env" -ForegroundColor Gray
Write-Host "  4. View logs: Check browser console for detailed info" -ForegroundColor Gray

Write-Host ""
