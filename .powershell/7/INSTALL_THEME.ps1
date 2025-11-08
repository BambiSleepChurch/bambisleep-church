# Cyber Neon Goth Wave Theme Installer
# Run this script to install the theme

Write-Host "🌊 Cyber Neon Goth Wave Theme Installer" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Magenta

# Method 1: Try to find Windows Terminal settings
$searchPaths = @(
    "$env:LOCALAPPDATA\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json",
    "$env:LOCALAPPDATA\Packages\Microsoft.WindowsTerminalPreview_8wekyb3d8bbwe\LocalState\settings.json",
    "$env:LOCALAPPDATA\Microsoft\Windows Terminal\settings.json",
    "$env:APPDATA\Microsoft\Windows Terminal\settings.json"
)

$themePath = "F:\.powershell\7\cyber-neon-settings.json"
$found = $false

foreach ($path in $searchPaths) {
    if (Test-Path $path) {
        Write-Host "✓ Found Windows Terminal settings at:" -ForegroundColor Green
        Write-Host "  $path`n" -ForegroundColor Yellow
        
        # Backup existing settings
        $backupPath = "$path.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        Copy-Item $path $backupPath -Force
        Write-Host "✓ Backed up existing settings to:" -ForegroundColor Green
        Write-Host "  $backupPath`n" -ForegroundColor Yellow
        
        # Install theme
        Copy-Item $themePath $path -Force
        Write-Host "✓ Theme installed successfully!" -ForegroundColor Green
        Write-Host "`n⚡ Restart Windows Terminal to see your new bling bling theme!`n" -ForegroundColor Magenta
        
        $found = $true
        break
    }
}

if (-not $found) {
    Write-Host "⚠ Windows Terminal settings not found automatically." -ForegroundColor Yellow
    Write-Host "`nManual Installation Steps:" -ForegroundColor Cyan
    Write-Host "1. Open Windows Terminal" -ForegroundColor White
    Write-Host "2. Press Ctrl+Shift+, (or Ctrl+, then click 'Open JSON file')" -ForegroundColor White
    Write-Host "3. This will open settings.json in your editor" -ForegroundColor White
    Write-Host "4. Replace ALL contents with the file:" -ForegroundColor White
    Write-Host "   F:\.powershell\7\cyber-neon-settings.json`n" -ForegroundColor Yellow
    
    Write-Host "OR copy this command to clipboard and run it:" -ForegroundColor Cyan
    Write-Host 'notepad "$env:LOCALAPPDATA\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json"' -ForegroundColor White
    Write-Host "`nThen paste the contents of cyber-neon-settings.json`n" -ForegroundColor White
}

Write-Host "`n🎨 Your theme includes:" -ForegroundColor Magenta
Write-Host "  ⚡ CyberNeonGothWave (hot pink cursor)" -ForegroundColor White
Write-Host "  ❄️  IcyGlassNeon (cyan cursor)" -ForegroundColor White
Write-Host "  🧊 Icy glass transparency effects" -ForegroundColor White
Write-Host "  💖 Barbie pink, teal, radiation green" -ForegroundColor White
Write-Host "  🖤 Pentablack background`n" -ForegroundColor White

Read-Host "Press Enter to exit"
