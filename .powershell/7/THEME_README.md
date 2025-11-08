# 🌊 Cyber Neon Goth Wave Theme for PowerShell

## 🎨 Color Palette

### Primary Colors
- **Magenta/Hot Pink**: `#FF10F0`, `#FF00FF` - Cursor & accents
- **Barbie Pink**: `#FF1493`, `#FF69B4` - Error messages & highlights
- **Red Pink**: `#FF006E` - Selection & critical elements
- **Teal**: `#00CED1` - Cyan text
- **Sky Blue**: `#87CEEB`, `#00F5FF` - Bright blue elements
- **Dark Teal**: `#008B8B` - Subtle accents
- **Radiation Green**: `#39FF14` - Success messages
- **Uranium Green**: `#7FFF00`, `#ADFF2F` - Bright green
- **Pentablack**: `#0A0014`, `#05000F` - Deep background

### Special Features
- **Icy Glass Effect**: 70-85% acrylic opacity with blur
- **Neon Glow**: High-contrast foreground colors on dark backgrounds
- **Goth Aesthetic**: Deep purples and blacks as base
- **Wave Vibe**: Cyan and aqua tones throughout

## 📦 Installation

### Option 1: Windows Terminal (Recommended)
1. Open Windows Terminal settings (`Ctrl+,`)
2. Click "Open JSON file" at bottom left
3. Merge contents from `cyber-neon-settings.json`
4. Save and restart Terminal

### Option 2: Direct Copy
```powershell
# Copy to Windows Terminal settings location
$wtPath = "$env:LOCALAPPDATA\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState"
Copy-Item "F:\.powershell\7\cyber-neon-settings.json" "$wtPath\settings.json" -Force
```

## 🎭 Two Themes Included

### 1. **CyberNeonGothWave** ⚡
- Ultra-vibrant neon colors
- Perfect for coding at night
- Hot pink cursor (#FF10F0)
- 80% acrylic opacity

### 2. **IcyGlassNeon** ❄️
- Cooler, icy blue tones
- Cyan cursor (#00FFFF)
- 70% acrylic opacity
- More subtle glass effect

## 🔧 Customization

### Adjust Glass Effect
Change `acrylicOpacity` values (0.0 - 1.0):
- More transparent: `0.6` - `0.7`
- Balanced: `0.75` - `0.8`
- More solid: `0.85` - `0.9`

### Change Neon Intensity
Modify foreground colors in the scheme:
- Dimmer: Use colors like `#80E0FF`
- Brighter: Use colors like `#00FFFF`

## 💡 Pro Tips

1. **Font Recommendations**:
   - Cascadia Code (included)
   - Fira Code (needs install)
   - JetBrains Mono Nerd Font

2. **Enable Ligatures** (for Cascadia Code):
   ```json
   "font": {
       "face": "Cascadia Code",
       "features": {
           "calt": 1,
           "liga": 1
       }
   }
   ```

3. **Add Retro Effect** (optional):
   ```json
   "experimental.retroTerminalEffect": true
   ```

4. **Background Image** (optional):
   Add a subtle cyberpunk/neon grid background at low opacity

## 🚀 Quick Start

After installation, your PowerShell will feature:
- ✨ Neon magenta/pink highlights
- 🧊 Icy glass transparency
- 🌊 Teal and cyan text colors
- ☢️ Radiation green for success
- 🖤 Deep goth black background
- 💖 Barbie pink accents

Enjoy your bling bling terminal! 🎉
