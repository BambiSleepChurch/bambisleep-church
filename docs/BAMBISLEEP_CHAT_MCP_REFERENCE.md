# BambiSleep™ Chat MCP Reference

> Trigger detection, TTS processing, chat management, psychedelic visual effects, and session handling for BambiSleep experiences.

## Overview

The BambiSleep-Chat MCP server provides tools for:

- **Trigger System**: Official BambiSleep trigger detection and highlighting
- **TTS Processing**: Text cleaning and sentence splitting for text-to-speech
- **Chat Management**: Session-based chat history with trigger tracking
- **Collar Mode**: Submission engagement toggle per session
- **Text Effects**: AI response highlighting with CAPS detection
- **Psychedelic Spirals**: Customizable visual effects with color presets and animations

## Base URL

```
/api/bambisleep-chat
```

## Trigger Endpoints

### Get All Triggers

```http
GET /api/bambisleep-chat/triggers
```

Returns all official triggers organized by category.

**Response:**

```json
{
  "triggers": [
    {
      "id": "bambi_sleep",
      "name": "Bambi Sleep",
      "description": "A powerful trigger...",
      "effect": "Instant deep trance trigger",
      "category": "primary",
      "categoryDescription": "Core identity and trance triggers"
    }
  ],
  "categories": {
    "primary": "Core identity and trance triggers",
    "mental": "Mental state and dumb-down triggers",
    "physical": "Body response and physical triggers"
  },
  "totalCount": 23
}
```

### Get Triggers by Category

```http
GET /api/bambisleep-chat/triggers/category/:category
```

**Parameters:**

- `category`: `primary`, `mental`, or `physical`

**Response:**

```json
{
  "category": "primary",
  "description": "Core identity and trance triggers",
  "triggers": [...],
  "count": 8
}
```

### Detect Triggers in Text

```http
POST /api/bambisleep-chat/triggers/detect
Content-Type: application/json

{
  "text": "Good Girl, Bambi Sleep now"
}
```

**Response:**

```json
{
  "triggers": [
    {
      "id": "good_girl",
      "name": "Good Girl",
      "category": "primary",
      "position": 0
    },
    {
      "id": "bambi_sleep",
      "name": "Bambi Sleep",
      "category": "primary",
      "position": 12
    }
  ],
  "count": 2,
  "originalText": "Good Girl, Bambi Sleep now"
}
```

### Process Message with Highlighting

```http
POST /api/bambisleep-chat/triggers/process
Content-Type: application/json

{
  "text": "Good Girl, time to sleep",
  "options": {
    "wrapTriggers": true,
    "cssClass": "trigger-highlight"
  }
}
```

**Response:**

```json
{
  "processed": "<span class=\"trigger-highlight\">Good Girl</span>, time to sleep",
  "triggers": [...]
}
```

### Set Active Triggers for Session

```http
POST /api/bambisleep-chat/triggers/active
Content-Type: application/json

{
  "sessionId": "session_123",
  "triggers": ["Bambi Sleep", "Good Girl", "Bambi Reset"]
}
```

### Get Active Triggers

```http
GET /api/bambisleep-chat/triggers/active/:sessionId
```

## TTS Endpoints

### Clean Text for TTS

```http
POST /api/bambisleep-chat/tts/clean
Content-Type: application/json

{
  "text": "Hello **Bambi**! Check https://example.com :)"
}
```

**Response:**

```json
{
  "cleaned": "hello bambi check link smile",
  "original": "Hello **Bambi**! Check https://example.com :)"
}
```

### Split into Sentences

```http
POST /api/bambisleep-chat/tts/split
Content-Type: application/json

{
  "text": "Good Girl. Bambi Sleep now. Wake up refreshed."
}
```

**Response:**

```json
{
  "sentences": ["Good Girl.", "Bambi Sleep now.", "Wake up refreshed."],
  "count": 3
}
```

### Process for TTS (Full Pipeline)

```http
POST /api/bambisleep-chat/tts/process
Content-Type: application/json

{
  "message": "**GOOD GIRL**. Relax deeply now."
}
```

**Response:**

```json
{
  "sentencePairs": [
    {
      "display": "**GOOD GIRL**.",
      "tts": "good girl"
    },
    {
      "display": "Relax deeply now.",
      "tts": "relax deeply now"
    }
  ],
  "count": 2
}
```

## Chat Endpoints

### Add Message to History

```http
POST /api/bambisleep-chat/chat/message
Content-Type: application/json

{
  "sessionId": "session_123",
  "message": {
    "text": "Hello Bambi",
    "username": "SweetBambi42",
    "isAI": false
  }
}
```

**Response:**

```json
{
  "id": "msg_1234567890_abc123def",
  "text": "Hello Bambi",
  "username": "SweetBambi42",
  "isAI": false,
  "timestamp": "2025-01-15T10:30:00.000Z",
  "triggers": [{ "id": "bambi", "name": "Bambi", "category": "primary" }]
}
```

### Get Chat History

```http
GET /api/bambisleep-chat/chat/history/:sessionId?limit=50&includeAI=true&includeUser=true
```

**Query Parameters:**

- `limit`: Max messages to return (default: 50)
- `includeAI`: Include AI messages (default: true)
- `includeUser`: Include user messages (default: true)

### Clear Chat History

```http
DELETE /api/bambisleep-chat/chat/history/:sessionId
```

### Generate Random Username

```http
GET /api/bambisleep-chat/chat/username
```

**Response:**

```json
{
  "username": "PrettyDoll73"
}
```

## Collar Endpoints

### Activate Collar

```http
POST /api/bambisleep-chat/collar/activate
Content-Type: application/json

{
  "sessionId": "session_123"
}
```

**Response:**

```json
{
  "sessionId": "session_123",
  "active": true,
  "message": "🔗 Collar activated - deeper submission engaged"
}
```

### Deactivate Collar

```http
POST /api/bambisleep-chat/collar/deactivate
Content-Type: application/json

{
  "sessionId": "session_123"
}
```

### Toggle Collar

```http
POST /api/bambisleep-chat/collar/toggle
Content-Type: application/json

{
  "sessionId": "session_123"
}
```

### Get Collar Status

```http
GET /api/bambisleep-chat/collar/status/:sessionId
```

## Text Effects Endpoints

### Process Highlights

Processes **bold** text and detects ALL CAPS triggers.

```http
POST /api/bambisleep-chat/effects/highlights
Content-Type: application/json

{
  "text": "**GOOD GIRL** you are doing so **well**",
  "options": {
    "boldClass": "ai-generated-highlight",
    "capsClass": "caps-trigger"
  }
}
```

**Response:**

```json
{
  "processed": "<span class=\"ai-generated-highlight caps-trigger\">GOOD GIRL</span> you are doing so <span class=\"ai-generated-highlight\">well</span>",
  "hasCaps": true,
  "hasBold": true
}
```

## Session Endpoints

### Create Session

```http
POST /api/bambisleep-chat/session
```

**Response:**

```json
{
  "sessionId": "session_1705312200000_x7k9m2p4q",
  "username": "DreamyAngel55",
  "activeTriggers": [],
  "collarActive": false
}
```

### Get Session Info

```http
GET /api/bambisleep-chat/session/:sessionId
```

**Response:**

```json
{
  "sessionId": "session_123",
  "exists": true,
  "activeTriggers": ["BAMBI SLEEP", "GOOD GIRL"],
  "collarActive": true,
  "messageCount": 24
}
```

### Destroy Session

```http
DELETE /api/bambisleep-chat/session/:sessionId
```

### Get All Sessions (Admin)

```http
GET /api/bambisleep-chat/sessions
```

**Response:**

```json
{
  "sessions": [
    {
      "sessionId": "session_123",
      "exists": true,
      "activeTriggers": ["BAMBI SLEEP"],
      "collarActive": false,
      "messageCount": 12
    }
  ],
  "totalCount": 1
}
```

## Trigger Categories

### Primary Triggers

Core identity and trance triggers:

| Trigger                  | Effect                           |
| ------------------------ | -------------------------------- |
| Bambi                    | Causes feelings of happiness     |
| Bambi Sleep              | Instant deep trance trigger      |
| Bambi Reset              | Memory wipe and replacement      |
| Good Girl                | Happiness, euphoria and pleasure |
| Bambi Wake and Obey      | Alert and obedient state         |
| Bambi Freeze             | Deepens trance, blanks mind      |
| Bambi Does as She's Told | Instant obedience override       |
| Bimbo Doll               | Relaxation and emptiness         |

### Mental Triggers

Mental state and dumb-down triggers:

| Trigger              | Effect                      |
| -------------------- | --------------------------- |
| Blonde Moment        | IQ drop and loss of thought |
| Snap and Forget      | Amnesia trigger             |
| Airhead Barbie       | Dumbdown level #1           |
| Braindead Bobblehead | Dumbdown level #2           |
| Cockblank Lovedoll   | Dumbdown level #3           |
| Giggletime           | Happy bimbo giggles         |
| Safe and Secure      | Comfort reinforcement       |

### Physical Triggers

Body response triggers:

| Trigger                | Effect                       |
| ---------------------- | ---------------------------- |
| Bambi Cum and Collapse | Instant release              |
| Drop for Cock          | Submission on command        |
| Bambi Limp             | Body goes limp               |
| Bambi Uniform Lock     | Conditioning in uniform      |
| Bambi Posture Lock     | Feminine posture enforcement |

## Usage Examples

### Complete Session Flow

```javascript
// 1. Create session
const session = await fetch("/api/bambisleep-chat/session", {
  method: "POST",
}).then((r) => r.json());

// 2. Set active triggers
await fetch("/api/bambisleep-chat/triggers/active", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    sessionId: session.sessionId,
    triggers: ["Bambi Sleep", "Good Girl"],
  }),
});

// 3. Send message with trigger detection
const message = await fetch("/api/bambisleep-chat/chat/message", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    sessionId: session.sessionId,
    message: {
      text: "Good Girl, you are doing well",
      username: session.username,
      isAI: false,
    },
  }),
}).then((r) => r.json());

// 4. Process AI response for TTS
const ttsData = await fetch("/api/bambisleep-chat/tts/process", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: aiResponse }),
}).then((r) => r.json());

// 5. Clean up
await fetch(`/api/bambisleep-chat/session/${session.sessionId}`, {
  method: "DELETE",
});
```

## Psychedelic Spiral Endpoints

### Get Color Presets

```http
GET /api/bambisleep-chat/spiral/presets
```

**Response:**

```json
{
  "presets": [
    {
      "id": "BAMBI_CLASSIC",
      "name": "Bambi Classic",
      "spiral1": [0, 128, 128],
      "spiral2": [255, 20, 147],
      "description": "Classic BambiSleep teal and pink"
    }
  ],
  "count": 10,
  "defaultPreset": "BAMBI_CLASSIC"
}
```

### Available Color Presets

| Preset ID | Name | Description |
|-----------|------|-------------|
| `BAMBI_CLASSIC` | Bambi Classic | Teal & Barbie Pink |
| `DEEP_TRANCE` | Deep Trance | Indigo & Blue Violet |
| `HYPNO_PINK` | Hypno Pink | Hot Pink & Light Pink |
| `MIND_MELT` | Mind Melt | Magenta & Cyan |
| `DREAM_STATE` | Dream State | Dark Violet & Medium Orchid |
| `SUBMISSIVE_BLUE` | Submissive Blue | Dodger Blue & Deep Sky Blue |
| `BIMBO_BARBIE` | Bimbo Barbie | Deep Pink & Hot Pink |
| `SLEEPY_LAVENDER` | Sleepy Lavender | Lavender & Thistle |
| `GOOD_GIRL_GOLD` | Good Girl Gold | Gold & Light Pink |
| `TRIGGER_RED` | Trigger Red | Crimson & Orange Red |

### Initialize Spiral Session

```http
POST /api/bambisleep-chat/spiral/init
Content-Type: application/json

{
  "sessionId": "session_123",
  "options": {
    "spiral1Width": 5.0,
    "enabled": true
  }
}
```

### Get Spiral Config

```http
GET /api/bambisleep-chat/spiral/config/:sessionId
```

### Update Spiral Parameters

```http
POST /api/bambisleep-chat/spiral/params
Content-Type: application/json

{
  "sessionId": "session_123",
  "params": {
    "spiral1Width": 8.0,
    "spiral2Width": 4.0,
    "spiral1Speed": 25,
    "spiral2Speed": 18,
    "iterations": 500
  }
}
```

### Update Spiral Colors

```http
POST /api/bambisleep-chat/spiral/colors
Content-Type: application/json

{
  "sessionId": "session_123",
  "colors": {
    "spiral1Color": [255, 0, 128],
    "spiral2Color": [0, 255, 200]
  }
}
```

### Apply Color Preset

```http
POST /api/bambisleep-chat/spiral/apply-preset
Content-Type: application/json

{
  "sessionId": "session_123",
  "presetId": "DEEP_TRANCE"
}
```

### Update Opacity

```http
POST /api/bambisleep-chat/spiral/opacity
Content-Type: application/json

{
  "sessionId": "session_123",
  "opacity": 0.7
}
```

### Generate Fade Animation

```http
POST /api/bambisleep-chat/spiral/fade
Content-Type: application/json

{
  "targetOpacity": 0.3,
  "duration": 3000
}
```

**Response:**

```json
{
  "type": "FADE_OPACITY",
  "targetOpacity": 0.3,
  "duration": 3000,
  "easing": "linear"
}
```

### Generate Pulse Animation

```http
POST /api/bambisleep-chat/spiral/pulse
Content-Type: application/json

{
  "minOpacity": 0.2,
  "maxOpacity": 1.0,
  "period": 2000
}
```

### Enable/Disable Spirals

```http
POST /api/bambisleep-chat/spiral/enabled
Content-Type: application/json

{
  "sessionId": "session_123",
  "enabled": true
}
```

### Get Preset for Trigger

```http
GET /api/bambisleep-chat/spiral/trigger-preset/:trigger
```

Maps triggers to recommended visual presets:

| Trigger | Recommended Preset |
|---------|-------------------|
| Bambi Sleep | DEEP_TRANCE |
| Good Girl | GOOD_GIRL_GOLD |
| Bambi Freeze | SUBMISSIVE_BLUE |
| Blonde Moment | BIMBO_BARBIE |
| Bimbo Doll | HYPNO_PINK |
| Bambi Reset | MIND_MELT |
| Bambi Limp | SLEEPY_LAVENDER |
| Drop for Cock | TRIGGER_RED |

### Generate Client Code

```http
GET /api/bambisleep-chat/spiral/client-code/:sessionId
```

Returns p5.js compatible JavaScript for rendering spirals client-side.

**Response:**

```json
{
  "sessionId": "session_123",
  "code": "// BambiSleep Psychedelic Spiral...",
  "config": { ... },
  "dependencies": ["p5.js"],
  "message": "📜 Client code generated"
}
```

## Integration with MCP Control Tower

The BambiSleep-Chat handlers are registered as an integrated service in the MCP Control Tower. The service maintains in-memory state for:

- Active triggers per session
- Collar status per session
- Chat history per session (max 100 messages)
- Spiral visual effects config per session

State is cleared when sessions are destroyed or the server restarts.

## Related Documentation

- [AGENT.md](AGENT.md) - Agent orchestration
- [STORAGE_MCP_REFERENCE.md](STORAGE_MCP_REFERENCE.md) - File storage
- [LMSTUDIO_MCP_REFERENCE.md](LMSTUDIO_MCP_REFERENCE.md) - LLM integration
