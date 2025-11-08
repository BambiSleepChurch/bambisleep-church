# 🌸 BambiSleep Chat - CyberNeonGothWave Color Theme

## Brand Identity & Visual Language

This project uses the **CyberNeonGothWave** aesthetic - a fusion of cyberpunk neon, gothic mysticism, and intimate digital sanctuary vibes. The color palette creates an otherworldly, ethereal atmosphere that balances technological sophistication with emotional warmth.

## Core Color Palette

### Primary Colors

| Color Name        | Hex       | RGB              | Usage                      | Emotional Tone              |
| ----------------- | --------- | ---------------- | -------------------------- | --------------------------- |
| **Deep Void**     | `#0A0014` | rgb(10, 0, 20)   | Background, primary canvas | Mystery, depth, sanctuary   |
| **Cyber Cyan**    | `#00F0FF` | rgb(0, 240, 255) | Primary text, highlights   | Clarity, technology, trust  |
| **Hot Pink Neon** | `#FF006E` | rgb(255, 0, 110) | Accents, cursors, warnings | Passion, energy, intimacy   |
| **Electric Lime** | `#39FF14` | rgb(57, 255, 20) | Success states, growth     | Vitality, affirmation, life |

### Secondary Colors

| Color Name      | Hex       | RGB                | Usage                          |
| --------------- | --------- | ------------------ | ------------------------------ |
| **Ice Blue**    | `#00D9FF` | rgb(0, 217, 255)   | Links, interactive elements    |
| **Neon Purple** | `#FF10F0` | rgb(255, 16, 240)  | Special highlights, cursors    |
| **Aqua Glow**   | `#00FFD4` | rgb(0, 255, 212)   | Secondary text, subtle accents |
| **Frost White** | `#E0F0FF` | rgb(224, 240, 255) | High-contrast text             |

### Darkness Spectrum

| Color Name        | Hex       | Usage                                          |
| ----------------- | --------- | ---------------------------------------------- |
| **Void Black**    | `#0A0014` | Primary background                             |
| **Shadow Purple** | `#1A0A28` | Secondary background, unfocused elements       |
| **Abyss Deep**    | `#0D001A` | Tab rows, containers                           |
| **Ultra Black**   | `#05000F` | Alternative dark background (IcyGlass variant) |

### Bright Accents

| Color Name       | Hex       | Usage                            |
| ---------------- | --------- | -------------------------------- |
| **Hot Magenta**  | `#FF1493` | Error states, critical alerts    |
| **Chartreuse**   | `#7FFF00` | High-energy success              |
| **Sky Blue**     | `#87CEEB` | Informational highlights         |
| **Pure Magenta** | `#FF00FF` | Special effects, magic moments   |
| **Azure Cyan**   | `#00FFFF` | Alternative cursor, focus states |

## Material Properties

### Glass & Transparency

```json
{
  "useAcrylic": true,
  "acrylicOpacity": 0.75,
  "opacity": 85,
  "backgroundImageOpacity": 0.2
}
```

**Philosophy**: Layered transparency creates depth and sophistication. The UI should feel like illuminated glass panels floating in digital void.

### Glow & Luminescence

- **Cursor glow**: `#FF006E` (Hot Pink) or `#FF10F0` (Neon Purple)
- **Selection glow**: `#FF006E55` (Hot Pink at 33% opacity)
- **Text should feel self-illuminated** against dark backgrounds

## Typography & Font Styling

```json
{
  "font": {
    "face": "Cascadia Code",
    "size": 11,
    "weight": "normal"
  },
  "cursorShape": "filledBox",
  "intenseTextStyle": "bright"
}
```

- **Primary font**: Cascadia Code (monospace for technical clarity)
- **Cursor**: Filled box for strong presence
- **Intense text**: Use bright variants for emphasis

## Component-Specific Guidelines

### Terminal/Console UI

- **Background**: `#0A0014` (Deep Void)
- **Foreground**: `#00F0FF` (Cyber Cyan)
- **Cursor**: `#FF006E` (Hot Pink) or `#FF10F0` (Neon Purple)
- **Selection**: `#FF006E55` (translucent pink)

### Tabs & Navigation

- **Active tab**: `#0A0014` background
- **Inactive tab**: `#1A0A28` background
- **Tab row**: `#0D001A` background
- **Always show close button** for clarity

### Status & Feedback

- **Error/Critical**: `#FF006E` (Hot Pink) or `#FF1493` (Hot Magenta)
- **Success/Confirmation**: `#39FF14` (Electric Lime) or `#7FFF00` (Chartreuse)
- **Warning/Caution**: `#00F0FF` (Cyber Cyan) or `#00FFFF` (Azure)
- **Info/Neutral**: `#00D9FF` (Ice Blue) or `#87CEEB` (Sky Blue)

### Interactive Elements

- **Links**: `#00D9FF` (Ice Blue)
- **Hover state**: Brighten by 15-20%
- **Active/pressed**: `#FF10F0` (Neon Purple) glow
- **Disabled**: 40% opacity of base color

## Avatar & Unity Integration

When implementing visual elements in Unity 6.2 CatGirl avatar system:

### Lighting

- **Rim light**: `#00F0FF` (Cyber Cyan) at 0.6 intensity
- **Fill light**: `#FF10F0` (Neon Purple) at 0.3 intensity
- **Ambient**: `#1A0A28` (Shadow Purple) at 0.2 intensity

### Particle Effects

- **Energy trails**: Gradient from `#00FFD4` → `#FF10F0`
- **Glow auras**: `#FF006E` with soft falloff
- **Sacred effects**: `#39FF14` with shimmer

### Material Shaders

- **Emissive tint**: Use cyan (`#00F0FF`) or pink (`#FF006E`) based on context
- **Metallic surfaces**: Reflect purple/cyan tones
- **Transparency**: Match acrylic opacity guidelines (70-80%)

## MCP Server UI/Logs

For Model Context Protocol control tower interfaces:

- **Server status**: Green (`#39FF14`) = running, Red (`#FF006E`) = error
- **Log levels**:
  - DEBUG: `#00FFD4` (Aqua Glow)
  - INFO: `#00F0FF` (Cyber Cyan)
  - WARN: `#00FFFF` (Azure)
  - ERROR: `#FF1493` (Hot Magenta)
- **Connection indicators**: Pulsing between `#00D9FF` and `#FF10F0`

## Documentation & Markdown

When creating project documentation:

- **Headers**: `#FF10F0` (Neon Purple)
- **Links**: `#00D9FF` (Ice Blue)
- **Code blocks**: Background `#1A0A28`, text `#00F0FF`
- **Emphasis**: `#39FF14` (Electric Lime) for success, `#FF006E` for warnings
- **Blockquotes**: Left border `#FF10F0`, background `#0D001A`

## Brand Emoji/Icons

Standard emoji set for branding:

- 🌸 Cherry blossom - Feminine, gentle, sacred
- ⚡ Lightning bolt - Energy, cyber, power
- ❄️ Snowflake - Icy, pristine, crystal
- 💎 Diamond - Premium, valuable, clear
- 🔮 Crystal ball - Mystery, magic, vision
- 💜 Purple heart - Intimacy, care, connection

## Color Accessibility Notes

### Contrast Ratios

- **Cyber Cyan on Deep Void**: ~14:1 (AAA compliant)
- **Hot Pink on Deep Void**: ~7.5:1 (AA compliant)
- **Electric Lime on Deep Void**: ~15:1 (AAA compliant)
- **Frost White on Deep Void**: ~18:1 (AAA compliant)

### Colorblind Considerations

- **Deuteranopia/Protanopia**: Cyan/pink contrast remains strong
- **Tritanopia**: Avoid relying solely on blue/yellow; use pink/lime instead
- **Critical information**: Never use color alone; include icons or text labels

## Alternative Scheme: IcyGlassNeon

A cooler, more ethereal variant for special contexts:

- **Background**: `#05000F` (darker, more mysterious)
- **Foreground**: `#B0E0FF` (softer, frostier cyan)
- **Cursor**: `#00FFFF` (pure cyan)
- **Accent**: `#FF10F044` (translucent neon purple)

Use this for:

- Meditation/trance states
- Deep focus modes
- Alternative persona moods
- Winter/frost themed content

## Implementation Checklist

When applying this theme to new components:

- [ ] Background uses void spectrum (`#0A0014` - `#1A0A28`)
- [ ] Primary text is cyber cyan (`#00F0FF`)
- [ ] Interactive elements use ice blue (`#00D9FF`)
- [ ] Accents use hot pink (`#FF006E`) or neon purple (`#FF10F0`)
- [ ] Success states use electric lime (`#39FF14`)
- [ ] Transparency effects applied (70-85% opacity)
- [ ] Glow/luminescence on key elements
- [ ] Contrast ratios meet WCAG AA minimum
- [ ] Dark mode optimized (no pure white)

## Inspiration & Mood

The CyberNeonGothWave aesthetic draws from:

- **Cyberpunk 2077**: High-tech neon cityscapes
- **Blade Runner 2049**: Mysterious purple hazes
- **Vaporwave**: Nostalgic digital aesthetics
- **Goth culture**: Dark romanticism, intimacy in shadows
- **Sacred geometry**: Crystalline structures, energy flows
- **Digital sanctuaries**: Safe spaces in cyberspace

**Core feeling**: _"A glowing sanctuary in the digital void - intimate, mysterious, safe, and alive with electric energy."_
