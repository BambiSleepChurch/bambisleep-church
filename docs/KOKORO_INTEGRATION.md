# Kokoro TTS Integration Guide

## Overview

The BambiSleep™ Church MCP Control Tower avatar system integrates with Kokoro-FastAPI, a neural text-to-speech (TTS) system that provides high-quality, consistent voice synthesis with superior phoneme accuracy for lip sync.

**🔴 Current Status**: Kokoro server OFFLINE - System automatically uses Web Speech API fallback

## Architecture

```
┌─────────────────────┐
│  AvatarController   │
│  (Dashboard UI)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐      ┌──────────────────┐
│  SpeechController   │──────│  Debug Logging   │
│  (speech.js)        │      │  (Enhanced)      │
└──────────┬──────────┘      └──────────────────┘
           │
      ┌────┴────┐
      │         │
      ▼         ▼
┌──────────┐ ┌─────────────────┐
│ Kokoro   │ │  Web Speech API │
│ TTS API  │ │   (Fallback)    │
│ PRIMARY  │ │   ACTIVE NOW    │
│ OFFLINE  │ │                 │
└──────────┘ └─────────────────┘
```

## Configuration

### Server Location

Kokoro TTS server configured at: **http://192.168.0.122:8880**

### Enhanced Settings (v2.0)

```javascript
{
  kokoroUrl: 'http://192.168.0.122:8880',
  useKokoro: true,          // Enable Kokoro (auto-falls back if unavailable)
  healthCheckTimeout: 5000, // 5 seconds
  healthCheckRetries: 2,    // NEW: Retry failed health checks
  requestTimeout: 30000,    // 30 seconds
  maxTextLength: 500,       // NEW: Limit text for stability
  debugMode: true,          // NEW: Enhanced debug logging
}
```

### Voice Presets (15 Total)

**Enhanced presets with Kokoro voice mappings:**

| Preset         | Emoji | Kokoro Voice | Speed | Description                |
| -------------- | ----- | ------------ | ----- | -------------------------- |
| `bambi`        | 🌸    | `af_bella`   | 0.95  | Bright, cheerful (default) |
| `gentle`       | 💕    | `af_heart`   | 0.92  | Warm and soothing          |
| `confident`    | 💪    | `af_jadzia`  | 1.00  | Strong and assured         |
| `professional` | 💼    | `af_sarah`   | 0.98  | Clear and articulate       |
| `energetic`    | ⚡    | `af_nova`    | 1.05  | Vibrant and lively         |
| `calm`         | 🌊    | `af_river`   | 0.88  | Peaceful and relaxing      |
| `airy`         | ☁️    | `af_sky`     | 0.90  | Light and ethereal         |
| `natural`      | 👩    | `af_jessica` | 1.00  | Authentic conversational   |
| `clear`        | 🔊    | `af_kore`    | 0.95  | Crisp and precise          |
| `smooth`       | 🎵    | `af_nicole`  | 0.93  | Silky and melodious        |
| `balanced`     | ⚖️    | `af_alloy`   | 0.98  | Neutral and well-rounded   |
| `warm`         | 🔥    | `af_aoede`   | 0.94  | Rich and inviting          |
| `whisper`      | 🌙    | `af_sky`     | 0.85  | Soft and intimate          |
| `machine`      | 🤖    | `af_kore`    | 0.90  | Synthetic robotic          |
| `robot`        | 🔧    | `af_alloy`   | 0.80  | Deep mechanical            |

## Available Kokoro Voices

12 high-quality female voices available:

```javascript
const KOKORO_VOICES = {
  af_alloy: { name: "Alloy", quality: "balanced" },
  af_aoede: { name: "Aoede", quality: "warm" },
  af_bella: { name: "Bella", quality: "bright" },
  af_heart: { name: "Heart", quality: "gentle" },
  af_jadzia: { name: "Jadzia", quality: "confident" },
  af_jessica: { name: "Jessica", quality: "natural" },
  af_kore: { name: "Kore", quality: "clear" },
  af_nicole: { name: "Nicole", quality: "smooth" },
  af_nova: { name: "Nova", quality: "energetic" },
  af_river: { name: "River", quality: "calm" },
  af_sarah: { name: "Sarah", quality: "professional" },
  af_sky: { name: "Sky", quality: "airy" },
};
```

## Enhanced Features (v2.0)

### 🔍 Debug System

- **Health Check Retries**: Automatically retries failed connections (default: 2 attempts)
- **Detailed Logging**: Comprehensive console logging for troubleshooting
- **Performance Metrics**: Response time, file size, and quality monitoring
- **Error Classification**: Distinguishes timeouts, network errors, and API errors

### 🎯 Phoneme Accuracy

Enhanced phoneme analysis for realistic lip sync:

- **Digraph Support**: Handles 'th', 'sh', 'ch', 'oo', 'ee'
- **Consonant Classification**: Bilabial, dental, velar grouping
- **Realistic Mouth Mapping**: 15 phoneme types with accurate mouth positions
- **Timing Precision**: Syncs phonemes to audio duration

### 🎵 Voice Quality Upgrades

- **15 Voice Presets**: Expanded from 5 to 15 unique personalities
- **Fine-Tuned Speeds**: Optimized speed values for each character type
- **Volume Control**: Per-preset volume adjustments
- **Fallback Optimization**: Enhanced Web Speech API parameters

## Debugging & Testing

### Quick Status Check

```javascript
// In browser console
const status = window.AvatarController?.speech?.getStatus();
console.log(status);
```

Expected output:

```javascript
{
  kokoroAvailable: false,           // Currently offline
  kokoroUrl: "http://192.168.0.122:8880",
  useKokoro: true,
  currentPreset: "bambi",
  currentPresetDetails: {
    name: "Bambi",
    emoji: "🌸",
    kokoroVoice: "af_bella",
    speed: 0.95
  },
  isSpeaking: false,
  queueLength: 0,
  webSpeechVoice: "Microsoft Zira Desktop - English (United States)",
  webSpeechAvailable: true,
  audioElement: "none"
}
```

### PowerShell Test Suite

Run comprehensive diagnostics:

```powershell
# Full test suite
.\tests\test-kokoro.ps1

# Custom Kokoro URL
.\tests\test-kokoro.ps1 -KokoroUrl "http://localhost:8880"

# Verbose mode
.\tests\test-kokoro.ps1 -Verbose
```

Test coverage:

1. ✅ Health endpoint (`/health`)
2. ✅ Models list (`/v1/models`)
3. ✅ Voices list (`/v1/audio/voices`)
4. ✅ TTS synthesis (`/v1/audio/speech`)
5. ✅ Voice preset quality tests

### Manual Kokoro Testing

```powershell
# Test health endpoint
Invoke-WebRequest -Uri "http://192.168.0.122:8880/health" -Method GET

# Test TTS synthesis
$body = @{
  model = "kokoro"
  voice = "af_bella"
  input = "Hello world!"
  response_format = "mp3"
  speed = 1.0
} | ConvertTo-Json

Invoke-WebRequest `
  -Uri "http://192.168.0.122:8880/v1/audio/speech" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body `
  -OutFile "test.mp3"
```

## Troubleshooting

### Kokoro Server Offline

**Symptoms:**

- ⚠️ Status shows "Kokoro TTS: OFFLINE"
- Console shows: "Kokoro TTS server unavailable"
- Fallback to Web Speech API activated

**Solutions:**

1. **Check Server Status**

   ```powershell
   Test-NetConnection -ComputerName 192.168.0.122 -Port 8880
   ```

2. **Start Kokoro Server**

   - Ensure Kokoro-FastAPI is running
   - Verify port 8880 is not blocked
   - Check firewall settings

3. **Update URL**

   ```javascript
   // In browser console
   window.AvatarController.speech.recheckKokoro();
   ```

4. **Use Alternative URL**
   - Localhost: `http://localhost:8880`
   - Network: `http://192.168.x.x:8880`

### Slow Response Times

**Optimization tips:**

- Limit text length to 500 characters
- Use faster voices (af_nova, af_kore)
- Increase speed values (0.95 → 1.1)
- Check network latency

### Lip Sync Issues

**Improvements made:**

- Enhanced phoneme detection (digraphs, consonant types)
- Better mouth position mapping (15 phoneme types)
- Timing sync to audio duration
- Smooth transitions with easing

## API Reference

### SpeechController

#### Constructor

```javascript
const speech = createSpeechController({
  preset: "bambi", // Voice preset name
  onLipSync: (mouthOpen) => {}, // Lip sync callback (0.0 - 1.0)
  kokoroUrl: "http://192.168.0.122:8880", // Kokoro server URL
  useKokoro: true, // Enable Kokoro (default: true)
});
```

#### Methods

##### `speak(text, options)`

Speak text using Kokoro TTS (or fallback to Web Speech).

```javascript
await speech.speak("Hello, I am Bambi!", {
  preset: "bambi", // Override default preset
  speed: 1.0, // Speed multiplier (Kokoro)
  // Web Speech fallback options:
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
});
```

**Parameters:**

- `text` (string): Text to speak
- `options` (object, optional):
  - `preset` (string): Voice preset override
  - `speed` (number): Kokoro speed (0.5 - 2.0)
  - `rate`, `pitch`, `volume` (number): Web Speech fallback parameters

**Returns:** `Promise<void>`

##### `stop()`

Stop current speech and clear queue.

```javascript
speech.stop();
```

##### `pause()`

Pause current speech.

```javascript
speech.pause();
```

##### `resume()`

Resume paused speech.

```javascript
speech.resume();
```

##### `setPreset(presetName)`

Change voice preset.

```javascript
speech.setPreset("machine");
```

**Parameters:**

- `presetName` (string): One of: `bambi`, `machine`, `robot`, `human`, `whisper`

##### `isKokoroAvailable()`

Check if Kokoro TTS is available.

```javascript
const available = speech.isKokoroAvailable();
// Returns: boolean
```

##### `recheckKokoro()`

Manually recheck Kokoro server health.

```javascript
const healthy = await speech.recheckKokoro();
// Returns: Promise<boolean>
```

##### `getStatus()`

Get comprehensive status information.

```javascript
const status = speech.getStatus();
// Returns: {
//   kokoroAvailable: boolean,
//   kokoroUrl: string,
//   useKokoro: boolean,
//   currentPreset: string,
//   isSpeaking: boolean,
//   queueLength: number,
//   webSpeechVoice: string,
// }
```

##### `getVoices()`

Get available voices from both Kokoro and Web Speech.

```javascript
const voices = speech.getVoices();
// Returns: {
//   kokoro: [{ id, name, quality }, ...],
//   webSpeech: [{ name, lang }, ...],
// }
```

##### `destroy()`

Cleanup resources (call when done).

```javascript
speech.destroy();
```

## Kokoro API Protocol

### Health Check

**Endpoint:** `GET /health`

**Response:**

```json
{
  "status": "ok"
}
```

### Speech Generation

**Endpoint:** `POST /v1/audio/speech`

**Request:**

```json
{
  "model": "kokoro",
  "voice": "af_bella",
  "input": "Text to synthesize",
  "response_format": "mp3",
  "speed": 0.95
}
```

**Response:** Binary audio data (MP3)

**Headers:**

- `Content-Type: application/json`
- `Connection: keep-alive` (for connection reuse)

## Integration Examples

### Basic Usage

```javascript
import { createSpeechController } from "./speech.js";

const speech = createSpeechController({
  preset: "bambi",
  onLipSync: (mouthOpen) => {
    console.log("Mouth:", mouthOpen);
  },
});

await speech.speak("Hello, world!");
```

### With Avatar Controller

```javascript
import { AvatarController } from "./components/AvatarController.js";

const avatar = new AvatarController();
await avatar.init();

// Speech is automatically integrated
await avatar.speak("Welcome to BambiSleep Church!");
```

### Manual Kokoro Call

```javascript
const response = await fetch("http://192.168.0.122:8880/v1/audio/speech", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "kokoro",
    voice: "af_bella",
    input: "Hello!",
    response_format: "mp3",
    speed: 1.0,
  }),
});

const audioBlob = await response.blob();
const audioUrl = URL.createObjectURL(audioBlob);

const audio = new Audio(audioUrl);
await audio.play();

// Cleanup
URL.revokeObjectURL(audioUrl);
```

### Custom Voice Configuration

```javascript
const speech = createSpeechController({
  preset: "bambi",
  onLipSync: (mouthOpen) => {
    avatar.setMouthOpen(mouthOpen);
  },
});

// Use different Kokoro voice
await speech.speak("Testing custom voice", {
  voice: "af_nova", // Directly specify Kokoro voice
  speed: 1.2,
});
```

## Lip Sync System

### How It Works

1. **Phoneme Analysis:** Text is analyzed for vowels and consonants
2. **Timing Calculation:** Phoneme delays are calculated based on audio duration
3. **Mouth Mapping:** Phonemes are mapped to mouth open amounts (0.0 - 1.0)
4. **Callback Triggering:** `onLipSync` callback is called at each phoneme interval

### Phoneme Mapping

```javascript
const PHONEME_MOUTH_MAP = {
  a: 0.8, // Wide open (ah)
  e: 0.4, // Medium (eh)
  i: 0.2, // Small (ee)
  o: 0.6, // Round (oh)
  u: 0.5, // Round medium (oo)
  _: 0.1, // Consonant (mostly closed)
  " ": 0.0, // Silence (closed)
};
```

### Duration-Based Timing

For Kokoro audio with known duration:

```javascript
const phonemeDelay = (audioDuration * 1000) / phonemes.length;
```

For Web Speech (unknown duration):

```javascript
const phonemeDelay = 100; // Fixed 100ms per phoneme
```

## Fallback Behavior

The system automatically falls back to Web Speech API when:

1. **Kokoro is disabled** - `useKokoro: false`
2. **Health check fails** - Server unreachable or unhealthy
3. **Request timeout** - No response within 30 seconds
4. **API error** - Kokoro returns error response
5. **Network error** - Connection refused or aborted

### Fallback Indicators

**UI Status:**

```
🌸 Kokoro TTS: Online (http://192.168.0.122:8880)
⚠️ Kokoro TTS: Offline - Using Web Speech fallback
```

**Console Logs:**

```javascript
console.log("🌸 Kokoro TTS server healthy");
console.warn("⚠️ Kokoro TTS server unavailable:", error.message);
console.warn("🎤 Kokoro failed, falling back to Web Speech:", error.message);
```

## Troubleshooting

### Kokoro Not Available

**Symptoms:**

- Status shows "Offline"
- Web Speech is being used
- Console shows connection errors

**Solutions:**

1. Verify server is running: `curl http://192.168.0.122:8880/health`
2. Check network connectivity to 192.168.0.122
3. Ensure port 8880 is not blocked by firewall
4. Click 🎤 button in dashboard to recheck health

### Poor Lip Sync Quality

**Symptoms:**

- Mouth movements don't match speech
- Timing is off

**Solutions:**

1. Use Kokoro TTS (better timing than Web Speech)
2. Adjust speech speed: `speech.speak(text, { speed: 0.8 })`
3. Ensure audio duration is available (Kokoro provides this)

### Slow Speech Generation

**Symptoms:**

- Long delays before speech starts
- Timeouts

**Solutions:**

1. Check Kokoro server performance
2. Increase timeout: `requestTimeout: 60000` (60s)
3. Use shorter text chunks
4. Enable HTTP keep-alive (already enabled)

### Audio Playback Errors

**Symptoms:**

- Audio doesn't play
- "Audio playback error" in console

**Solutions:**

1. Check browser audio permissions
2. Ensure MP3 codec support
3. Verify audio element creation
4. Check for CORS issues (should be none on same network)

## Performance Optimization

### Connection Reuse

HTTP keep-alive is enabled by default for faster subsequent requests:

```javascript
headers: {
  'Connection': 'keep-alive',
}
```

### Request Queueing

Speech requests are automatically queued and processed sequentially:

```javascript
await speech.speak("First sentence");
await speech.speak("Second sentence");
// Both will be queued and spoken in order
```

### Resource Cleanup

Audio blobs are automatically cleaned up after playback:

```javascript
audio.onended = () => {
  URL.revokeObjectURL(audioUrl); // Cleanup
  resolve();
};
```

## Security Considerations

### Network Access

- Kokoro server is on local network (192.168.0.122)
- No external API keys required
- No data sent outside local network

### CORS

No CORS issues since:

- Dashboard and Kokoro are on same local network
- Fetch API is used (not XHR cross-origin)

### Audio Data

- Audio blobs are stored in memory temporarily
- Object URLs are revoked after playback
- No persistent audio storage

## Future Enhancements

### Potential Improvements

1. **WebSocket Integration** - Real-time streaming for lower latency
2. **Voice Cloning** - Custom voice training for Bambi persona
3. **SSML Support** - Advanced prosody control
4. **Caching** - Cache generated audio for repeated phrases
5. **Batch Generation** - Pre-generate common phrases
6. **Emotion Detection** - Adjust voice based on text sentiment
7. **Multi-language** - Support for non-English synthesis

## References

- **Kokoro TTS:** High-quality neural voice synthesis
- **Web Speech API:** Browser fallback (https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- **OpenAI Audio API:** Kokoro uses OpenAI-compatible format
- **Avatar System:** See [AVATAR_SYSTEM.md](./AVATAR_SYSTEM.md)

## Support

For issues or questions:

1. Check console logs for error details
2. Verify Kokoro server status
3. Test Web Speech fallback
4. Review this documentation

---

**BambiSleep™ Church MCP Control Tower** - Phase 7 Complete ✅
