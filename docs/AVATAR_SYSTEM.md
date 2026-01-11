# Avatar System Documentation

## Overview

The BambiSleep™ MCP Control Tower includes a fully integrated WebGL avatar system with voice synthesis, providing an immersive visual interface for the AI agent. The system features GPU-accelerated rendering, real-time lip sync, and multiple personality expressions.

## Architecture

### Core Components

| Component         | Location                                          | Purpose                                          |
| ----------------- | ------------------------------------------------- | ------------------------------------------------ |
| WebGL Avatar      | `src/dashboard/js/avatar-webgl.js`                | GPU-accelerated face rendering with SDF shaders  |
| Speech Synthesis  | `src/dashboard/js/speech.js`                      | Web Speech API with phoneme lip sync             |
| Avatar Controller | `src/dashboard/js/components/AvatarController.js` | Integration layer between avatar, speech, and UI |
| Avatar Styles     | `src/dashboard/css/components/avatar.css`         | Glass morphism styling for avatar panel          |

### Technology Stack

- **WebGL 2.0** - GPU-accelerated graphics
- **Fragment Shaders** - Signed Distance Fields (SDF) for face geometry
- **Web Speech API** - Browser-native text-to-speech
- **Phoneme Analysis** - Real-time mouth movement calculation

## WebGL Avatar

### Initialization

```javascript
import WebGLAvatar from "./avatar-webgl.js";

const canvas = document.getElementById("avatar-canvas");
const avatar = new WebGLAvatar(canvas);
avatar.start();
```

### Face Rendering

The avatar uses SDF (Signed Distance Field) techniques for smooth, scalable rendering:

- **Head**: Ellipse with pointed chin (elven style)
- **Ears**: Pointed elven ears with rotation
- **Eyes**: Tracking ellipses with blink animation
- **Mouth**: Dynamic ellipse with expression curve

### Expressions

All expressions are accessible via method calls:

| Expression | Method              | Description                     |
| ---------- | ------------------- | ------------------------------- |
| Happy      | `avatar.happy()`    | Smile with blink                |
| Sleepy     | `avatar.sleepy()`   | Half-closed eyes, neutral mouth |
| Alert      | `avatar.alert()`    | Wide eyes, slight smile         |
| Reset      | `avatar.reset()`    | Return to neutral               |
| Confused   | `avatar.confused()` | Eyes dart left-right            |
| Comfort    | `avatar.comfort()`  | Gentle smile, relaxed eyes      |
| Giggle     | `avatar.giggle()`   | Animated laugh sequence         |

### Eye Tracking

The avatar's eyes follow the mouse cursor automatically:

```javascript
// Automatic mouse tracking
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  avatar.setEyePosition(
    (e.clientX - rect.left) / rect.width,
    (e.clientY - rect.top) / rect.height
  );
});
```

### Themes

Two visual themes are available:

| Theme    | Colors                     | Use Case                 |
| -------- | -------------------------- | ------------------------ |
| Neon     | Dark bg + glowing features | Default dark mode        |
| Inverted | Light bg + dark features   | Light mode compatibility |

```javascript
avatar.setTheme("neon"); // Dark + glow
avatar.setTheme("inverted"); // Light mode
```

## Speech Synthesis

### Voice Presets

Five distinct voice personalities:

| Preset     | Rate | Pitch | Volume | Description            |
| ---------- | ---- | ----- | ------ | ---------------------- |
| 🌸 Bambi   | 1.05 | 1.2   | 1.0    | Bubbly and cheerful    |
| 🤖 Machine | 0.95 | 0.85  | 1.0    | Synthetic robotic      |
| ⚡ Robot   | 0.8  | 0.7   | 0.9    | Deep mechanical        |
| 👩 Human   | 1.0  | 1.1   | 1.0    | Natural conversational |
| 🌙 Whisper | 0.85 | 0.95  | 0.7    | Soft and intimate      |

### Usage

```javascript
import { createSpeechController } from "./speech.js";

const speech = createSpeechController({
  preset: "bambi",
  onLipSync: (mouthOpen) => {
    avatar.setMouthOpen(mouthOpen);
  },
});

// Speak with default preset
await speech.speak("Hello! I'm Bambi!");

// Speak with custom settings
await speech.speak("Emergency alert!", {
  preset: "robot",
  interrupt: true,
});
```

### Lip Sync

The speech controller analyzes text phonemes and triggers lip sync callbacks:

- **Vowels** (a, e, i, o, u) → Mouth open 20-80%
- **Consonants** → Mouth 10% open
- **Silence** → Mouth closed

```javascript
// Phoneme to mouth open mapping
const vowelMap = {
  a: 0.8, // Wide open (as in "father")
  e: 0.4, // Medium (as in "bed")
  i: 0.2, // Small (as in "beet")
  o: 0.6, // Round (as in "go")
  u: 0.5, // Round medium (as in "food")
};
```

## Avatar Controller

### UI Components

The Avatar Controller provides a unified interface:

```javascript
import { initAvatarController } from "./components/AvatarController.js";

const controller = await initAvatarController();
controller.speak("Welcome to BambiSleep™!");
controller.setExpression("happy");
```

### Expression Buttons

Seven expression buttons trigger avatar animations:

- 😊 Happy
- 😴 Sleepy
- 👀 Alert
- 😐 Reset
- 😕 Confused
- 🤗 Comfort
- 😄 Giggle

### Test Speech Interface

Manual testing with:

- Text input field
- Voice preset selector
- Speak button
- Stop button

## Agent Integration

### Agent Tools

Six new agent tools enable AI control:

| Tool                    | Parameters                                               | Description            |
| ----------------------- | -------------------------------------------------------- | ---------------------- |
| `avatar_set_expression` | `{ expression: string }`                                 | Set facial expression  |
| `avatar_speak`          | `{ text: string, preset?: string, interrupt?: boolean }` | Speak with lip sync    |
| `avatar_stop_speaking`  | `{}`                                                     | Stop current speech    |
| `avatar_set_theme`      | `{ theme: 'neon' \| 'inverted' }`                        | Change visual theme    |
| `avatar_start`          | `{}`                                                     | Start avatar rendering |
| `avatar_stop`           | `{}`                                                     | Stop avatar rendering  |

### Example Agent Usage

Agent can respond with both text and avatar control:

```javascript
// Agent response with avatar
{
  "message": "Good job! *giggles*",
  "tool_calls": [
    {
      "name": "avatar_set_expression",
      "arguments": { "expression": "giggle" }
    },
    {
      "name": "avatar_speak",
      "arguments": {
        "text": "Good job!",
        "preset": "bambi"
      }
    }
  ]
}
```

## WebSocket Integration

Avatar commands flow through WebSocket for real-time control:

```javascript
// Backend (agent-tools.js)
async execute(toolName, args) {
  if (toolName === 'avatar_speak') {
    this.#wsServer.broadcast({
      type: 'render',
      command: 'avatarSpeak',
      payload: args,
    });
  }
}

// Frontend (websocket.js)
socket.on('message', (data) => {
  if (data.type === 'render' && data.command === 'avatarSpeak') {
    window.AvatarController?.speak(data.payload.text, data.payload);
  }
});
```

## Styling

### Glass Morphism Panel

The avatar panel uses glass morphism design:

```css
.avatar-panel {
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
}
```

### Responsive Canvas

Avatar canvas scales across devices:

```css
.avatar-canvas {
  width: 400px;
  height: 400px;
  max-width: 100%;
}

@media (max-width: 768px) {
  .avatar-canvas {
    width: 100%;
    height: auto;
    aspect-ratio: 1 / 1;
  }
}
```

## Performance

### GPU Acceleration

- **Fragment Shader**: Runs on GPU for real-time SDF rendering
- **60 FPS**: Smooth animation at 60 frames per second
- **WebGL 2.0**: Modern graphics API with GLSL 3.0 shaders

### Optimization Techniques

1. **SDF Rendering**: Mathematically defined shapes (no textures)
2. **Fullscreen Quad**: Single draw call per frame
3. **Uniform Updates**: Minimal CPU-to-GPU data transfer
4. **Blink Cycle**: 4-second intervals reduce animation overhead

## Browser Support

### Requirements

- **WebGL 2.0** support
- **Web Speech API** support
- Modern browser (Chrome 56+, Firefox 51+, Safari 15+, Edge 79+)

### Fallback

If WebGL 2.0 is unavailable, avatar fails gracefully:

```javascript
try {
  const avatar = new WebGLAvatar(canvas);
} catch (error) {
  console.warn("Avatar not supported:", error);
  // Show static image fallback
}
```

## Troubleshooting

### Avatar Not Rendering

1. Check WebGL support: `chrome://gpu/`
2. Ensure canvas element exists
3. Check browser console for shader errors

### Speech Not Working

1. Test Web Speech API: `window.speechSynthesis.getVoices()`
2. Check browser permissions
3. Ensure audio is not muted

### Lip Sync Delay

1. Adjust phoneme interval (default 100ms)
2. Use simpler text (fewer syllables)
3. Check CPU usage (speech synthesis is CPU-intensive)

## Future Enhancements

### Phase 8 Ideas

- [ ] Multiple avatar models (male, non-binary, different styles)
- [ ] Custom expression designer
- [ ] GLTF model support for 3D avatars
- [ ] Facial capture from webcam
- [ ] Multi-language phoneme maps
- [ ] Custom voice training

## API Reference

### WebGLAvatar Class

```typescript
class WebGLAvatar {
  constructor(canvas: HTMLCanvasElement);

  // Lifecycle
  start(): void;
  stop(): void;
  destroy(): void;

  // Expressions
  setExpression(value: number): void; // -1 to 1
  setMouthOpen(value: number): void; // 0 to 1
  happy(): void;
  sleepy(): void;
  alert(): void;
  reset(): void;
  confused(): void;
  comfort(): void;
  giggle(): void;

  // Appearance
  setTheme(theme: "neon" | "inverted"): void;

  // Animation
  startSpeaking(): void;
  stopSpeaking(): void;
}
```

### SpeechController Class

```typescript
class SpeechController {
  constructor(options?: {
    preset?: string;
    onLipSync?: (mouthOpen: number) => void;
  });

  // Speech
  speak(
    text: string,
    options?: {
      preset?: string;
      rate?: number;
      pitch?: number;
      volume?: number;
      interrupt?: boolean;
    }
  ): Promise<void>;

  stop(): void;
  pause(): void;
  resume(): void;

  // Configuration
  setPreset(name: string): void;
  getPreset(): string;
  setLipSyncCallback(callback: (mouthOpen: number) => void): void;

  // State
  isSpeaking(): boolean;
  isPaused(): boolean;
  getQueueLength(): number;
  clearQueue(): void;
}
```

### AvatarController Class

```typescript
class AvatarController {
  init(): Promise<void>;

  // Control
  toggle(): void;
  start(): void;
  stop(): void;

  // Actions
  setExpression(expression: string): void;
  speak(text: string, options?: object): Promise<void>;
  stopSpeaking(): void;

  // Cleanup
  destroy(): void;
}
```

## Credits

- **WebGL Shaders**: Custom SDF rendering by BambiSleep™ Team
- **Voice Synthesis**: Built on Web Speech API standard
- **Design**: Cyber goth aesthetic with glass morphism
- **Inspiration**: bambisleep-church-agent Phase 7

---

**BambiSleep™ Church MCP Control Tower** - Phase 7 Complete ✨
