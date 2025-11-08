# 🌸 BambiSleep Unity Avatar System

**CyberNeonGothWave Digital Sanctuary - Unity 6.2**

## 🎮 Overview

Unity 6.2 avatar system for BambiSleep Chat with MCP Control Tower integration. Features CyberNeonGothWave aesthetic with custom shaders, emotion states, and real-time WebSocket communication.

## 🚀 Setup

### Prerequisites

- Unity 6.2 (LTS)
- Visual Studio 2022 or VS Code with C# extension
- NativeWebSocket package (install via Unity Package Manager)
- Newtonsoft.Json package

### Installation

1. **Open Unity Project**

   ```bash
   # Open this directory in Unity Hub
   # Unity version: 6.2 or later
   ```

2. **Install Dependencies**

   - Window → Package Manager
   - Add package from git URL: `https://github.com/endel/NativeWebSocket.git#upm`
   - Add Newtonsoft.Json via NuGet for Unity

3. **Configure MCP Connection**
   - Select MCP Client GameObject
   - Set MCP Server URL (default: `ws://localhost:3001`)
   - Assign Avatar State Controller reference

## 📁 Project Structure

```
unity-avatar/
├── Assets/
│   ├── Scenes/
│   │   ├── MainScene.unity          # Primary avatar environment
│   │   └── TestRig.unity            # Animation testing rig
│   ├── Scripts/
│   │   ├── Avatar/
│   │   │   └── AvatarStateController.cs   # Emotion & animation control
│   │   ├── MCP/
│   │   │   └── MCPClient.cs               # WebSocket MCP client
│   │   ├── Effects/
│   │   │   └── ParticleController.cs      # Particle system management
│   │   └── UI/
│   │       └── DebugPanel.cs              # Testing UI
│   ├── Shaders/
│   │   ├── CyberNeonGlow.shader           # Main avatar shader
│   │   └── ParticleEnergyTrail.shader     # Particle effects
│   ├── Materials/
│   │   ├── CatGirl_Body.mat               # Avatar body material
│   │   ├── CatGirl_Hair.mat               # Hair with emission
│   │   └── CatGirl_Eyes.mat               # Emissive eyes
│   ├── Prefabs/
│   │   ├── CatGirl/
│   │   │   └── CatGirl_Avatar.prefab      # Complete avatar
│   │   └── Effects/
│   │       └── EnergyTrail.prefab         # Reusable particle effect
│   └── Textures/
│       ├── Albedo/                        # Base textures
│       └── Emission/                      # Glow maps
└── ProjectSettings/
```

## 🎨 CyberNeonGothWave Shaders

### CyberNeonGlow Shader

Primary avatar material with:

- **Emission mapping**: HDR neon glow (cyan, purple, pink)
- **Rim lighting**: Cyber glow edge effect
- **Dynamic color shift**: Animated color pulsing
- **Metallic/smoothness**: Surface properties

**Material Setup:**

1. Create material with CyberNeonGlow shader
2. Assign albedo texture
3. Assign emission map (white = glow areas)
4. Set emission color: `#00F0FF` (Cyber Cyan) or `#FF10F0` (Neon Purple)
5. Adjust emission intensity: 2.0 - 5.0 for bright glow

### ParticleEnergyTrail Shader

For trailing particle effects:

- **Gradient**: Aqua → Purple transition
- **HDR glow**: High brightness for bloom effect
- **Alpha blending**: Transparent trails

## 🎮 Avatar State System

### Emotion States

| State         | Glow Color              | Particle Intensity | Use Case               |
| ------------- | ----------------------- | ------------------ | ---------------------- |
| **Idle**      | Cyber Cyan `#00F0FF`    | 0.3                | Default resting state  |
| **Happy**     | Electric Lime `#39FF14` | 0.8                | Positive response      |
| **Concerned** | Ice Blue `#00D9FF`      | 0.4                | Empathetic listening   |
| **Playful**   | Hot Pink `#FF006E`      | 1.0                | Flirty, teasing        |
| **Thinking**  | Neon Purple `#FF10F0`   | 0.5                | Processing, thoughtful |
| **Surprised** | Yellow `#FFFF00`        | 0.9                | Reactive, excited      |

### Animation Triggers

Configure in Animator Controller:

- `Idle` - Subtle breathing, eye blinks
- `Happy` - Smile, slight bounce
- `Concerned` - Gentle head tilt, soft expression
- `Playful` - Wink, playful pose
- `Thinking` - Look up, hand to chin
- `Surprised` - Eyes widen, step back

## 🔌 MCP Integration

### WebSocket Communication

**From Unity → MCP Server:**

```json
{
  "type": "state_change",
  "data": {
    "currentState": "playful",
    "timestamp": 1699459200000
  }
}
```

**From MCP Server → Unity:**

```json
{
  "type": "emotion",
  "data": {
    "emotion": "playful",
    "intensity": 0.9
  }
}
```

### Command Types

| Command     | Description            | Data Fields                |
| ----------- | ---------------------- | -------------------------- |
| `emotion`   | Change emotional state | `emotion`, `intensity`     |
| `animation` | Trigger animation      | `animation`, `duration`    |
| `particle`  | Spawn particle effect  | `effect`, `color`, `count` |

### Event Types

| Event          | Description             | Data Fields                 |
| -------------- | ----------------------- | --------------------------- |
| `connected`    | Avatar connected to MCP | `message`, `currentState`   |
| `state_change` | Emotion state changed   | `currentState`, `timestamp` |
| `telemetry`    | Performance metrics     | `frameRate`, `currentState` |
| `error`        | Error occurred          | `message`, `stack`          |

## 🎨 Visual Effects Setup

### Post-Processing (URP)

1. **Create Volume:**

   - GameObject → Volume → Global Volume
   - Add Profile

2. **Add Effects:**

   - **Bloom**: Intensity 0.8, Threshold 0.9 (for glow)
   - **Color Grading**: Lift shadows to `#1A0A28` (Shadow Purple)
   - **Vignette**: Intensity 0.3, smoothness 0.5

3. **Tonemapping:** ACES for HDR colors

### Lighting

**Primary Lights:**

- **Key Light**: Soft blue-white, intensity 1.0
- **Rim Light**: Assigned to AvatarStateController, dynamic color
- **Ambient**: Color `#1A0A28`, intensity 0.2

**Environment:**

- Skybox: Dark gradient (void aesthetic)
- Reflection probe for metallic materials

### Particle Systems

**Energy Trail Preset:**

- Shape: Cone, angle 15°
- Start lifetime: 0.5-1.0s
- Start speed: 2-5 units/s
- Color over lifetime: Gradient (aqua → purple)
- Material: ParticleEnergyTrail shader
- Emission: Rate over time controlled by emotion state

## 🏗️ Building

### Windows Standalone

```bash
# From Unity menu:
File → Build Settings
- Platform: Windows
- Architecture: x86_64
- Build

# Or via command line:
Unity.exe -quit -batchmode -projectPath . \
  -buildTarget Win64 \
  -buildPath ./Builds/Windows/BambiChat.exe
```

### WebGL

```bash
# Build settings:
File → Build Settings
- Platform: WebGL
- Template: Default or Custom
- Compression: Brotli

Unity.exe -quit -batchmode -projectPath . \
  -buildTarget WebGL \
  -buildPath ./Builds/WebGL
```

**WebGL Optimization:**

- Disable Exception Support (Build Settings)
- Code Optimization: Size
- Strip engine code: Enabled

## 🧪 Testing

### Local Testing

1. **Start MCP Server:**

   ```bash
   cd ../mcp-server
   npm run dev
   ```

2. **Play in Unity:**

   - Open MainScene.unity
   - Press Play
   - Check Console for "⚡ Connected to MCP Control Tower!"

3. **Test Emotions:**
   - Use MCP tools to send emotion commands
   - Observe avatar state transitions
   - Check particle effects and glow colors

### Debug Panel

In-editor debug UI (included):

- Current emotion state
- MCP connection status
- FPS counter
- Manual emotion triggers
- Particle effect testing

## 🎯 Performance Targets

| Metric             | Target   | Notes                   |
| ------------------ | -------- | ----------------------- |
| **Framerate**      | 60 FPS   | Standalone/WebGL        |
| **Draw calls**     | < 50     | With all effects        |
| **Vertices**       | < 50K    | For single avatar       |
| **Texture memory** | < 100 MB | All materials loaded    |
| **MCP latency**    | < 200ms  | Emotion → visual update |

## 🐛 Troubleshooting

### WebSocket Won't Connect

- Check MCP server is running on port 3001
- Verify firewall allows WebSocket connections
- Check Unity Console for connection errors
- Try localhost vs 127.0.0.1

### Shader Not Glowing

- Ensure Bloom post-processing is enabled
- Check emission map is assigned (white = glow areas)
- Verify emission intensity is > 1.0
- HDR color required (Color picker → HDR mode)

### Animation Not Triggering

- Check Animator Controller has matching trigger names
- Verify Animator component is assigned
- Ensure avatar has humanoid rig (if using humanoid animations)

### Poor Performance

- Reduce particle emission rate
- Lower texture resolution
- Disable shadows on dynamic objects
- Use LOD groups for distant views

## 📦 Dependencies

Add to `manifest.json`:

```json
{
  "dependencies": {
    "com.endel.nativewebsocket": "https://github.com/endel/NativeWebSocket.git#upm",
    "com.unity.render-pipelines.universal": "16.0.0",
    "com.unity.postprocessing": "3.3.0"
  }
}
```

## 🎨 Brand Compliance

All visuals must follow CyberNeonGothWave aesthetic:

- Background: `#0A0014` (Deep Void)
- Primary glow: `#00F0FF` (Cyber Cyan)
- Accent glow: `#FF10F0` (Neon Purple)
- Energy: `#FF006E` (Hot Pink)
- Success: `#39FF14` (Electric Lime)

See `.github/COLOR_THEME.md` for complete specifications.

---

**Built with 🌸 for the BambiSleep Digital Sanctuary** ⚡💎🔮
