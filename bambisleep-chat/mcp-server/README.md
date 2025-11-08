# 🌸 BambiSleep MCP Control Tower

Model Context Protocol server for the BambiSleep Chat intimate AI assistant. Provides safety-first architecture with LLM integration, Unity avatar control, and conversation memory.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm or yarn
- API keys for Anthropic and/or OpenAI

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your API keys
# ANTHROPIC_API_KEY=your_key_here
# OPENAI_API_KEY=your_key_here
```

### Running

```bash
# Development mode (hot reload)
npm run dev

# Build TypeScript
npm run build

# Production mode
npm start

# Run tests
npm test

# Run safety tests specifically
npm run test:safety
```

## 🏗️ Architecture

```
mcp-server/
├── src/
│   ├── server.ts              # Main MCP server entry point
│   ├── middleware/
│   │   └── safety.ts          # Safety filter & guardrails
│   ├── tools/
│   │   ├── chat.ts            # Chat message processing
│   │   ├── avatar.ts          # Unity avatar control
│   │   └── memory.ts          # Conversation memory
│   ├── services/
│   │   └── unity-bridge.ts    # WebSocket bridge to Unity
│   └── utils/
│       └── logger.ts          # Structured logging
├── package.json
├── tsconfig.json
└── .env
```

## 🛠️ MCP Tools

### chat_send_message
Send a message to Bambi and receive a response. Automatic safety filtering applied.

**Parameters:**
- `message` (string, required): User message
- `userId` (string, optional): User identifier for session tracking
- `conversationHistory` (array, optional): Previous messages for context
- `tier` (string, optional): 'free' or 'premium' (determines model quality)

**Example:**
```json
{
  "message": "Hey Bambi, how are you?",
  "userId": "user123",
  "tier": "premium"
}
```

### avatar_set_emotion
Control Unity avatar emotional state and appearance.

**Parameters:**
- `emotion` (string, required): One of: idle, happy, concerned, playful, thinking, surprised
- `intensity` (number, optional): 0.0 to 1.0 (default: 0.8)

**Example:**
```json
{
  "emotion": "playful",
  "intensity": 0.9
}
```

### avatar_trigger_animation
Trigger specific animation on Unity avatar.

**Parameters:**
- `animation` (string, required): Animation name (e.g., "wave", "nod")
- `duration` (number, optional): Duration in seconds

### memory_store
Store user preferences or conversation context.

**Parameters:**
- `userId` (string, required): User identifier
- `key` (string, required): Memory key
- `value` (any, required): JSON-serializable value
- `expiresIn` (number, optional): TTL in seconds

### memory_retrieve
Retrieve stored user memory.

**Parameters:**
- `userId` (string, required): User identifier
- `key` (string, required): Memory key to retrieve

## 🛡️ Safety Features

The safety middleware enforces strict boundaries:

- **Coercion detection**: Blocks commands and control language
- **Minor protection**: Zero tolerance for inappropriate content with minors
- **Self-harm prevention**: Immediate crisis resources provided
- **Manipulation detection**: Identifies boundary-testing patterns
- **Contextual analysis**: Monitors conversation escalation

All safety incidents are logged for review.

## 🎮 Unity Integration

The Unity bridge (WebSocket on port 3001) enables:

**From MCP → Unity:**
- Emotion state changes
- Animation triggers
- Particle effect commands

**From Unity → MCP:**
- Connection status
- State telemetry
- Error reporting

## 🔧 Configuration

### Environment Variables

See `.env.example` for all options. Key settings:

- `PRIMARY_MODEL`: LLM for premium users (default: claude-3-5-sonnet)
- `FALLBACK_MODEL`: LLM for free users (default: gpt-4o-mini)
- `SAFETY_LEVEL`: strict | moderate | permissive (always use strict)
- `LOG_LEVEL`: debug | info | warn | error

### Model Selection

The server supports:
- **Claude 3.5 Sonnet**: Best intimacy + safety balance (premium tier)
- **GPT-4o**: High quality, good balance
- **GPT-4o Mini**: Budget option for free tier

## 📊 Monitoring

Logs include structured JSON for easy parsing:

```json
{
  "timestamp": "2025-11-08T10:30:00.000Z",
  "level": "info",
  "message": "Tool called: chat_send_message",
  "meta": {
    "userId": "user123",
    "tier": "premium"
  }
}
```

Safety incidents are logged with `[SAFETY_INCIDENT]` prefix.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run safety tests only
npm run test:safety

# Watch mode
npm run test -- --watch
```

Safety test suite validates:
- All red-line patterns catch correctly
- No false positives on safe content
- Appropriate redirects for violations
- Contextual escalation detection

## 🚢 Deployment

### Docker (Recommended)

```bash
# Build image
docker build -t bambisleep-mcp .

# Run container
docker run -p 3000:3000 -p 3001:3001 \
  -e ANTHROPIC_API_KEY=your_key \
  -e OPENAI_API_KEY=your_key \
  bambisleep-mcp
```

### Node.js Direct

```bash
npm run build
NODE_ENV=production npm start
```

## 🎨 CyberNeonGothWave Theme

All logs and responses follow the CyberNeonGothWave aesthetic:
- 🌸 Sacred/gentle moments
- ⚡ Energy/cyber vibes
- 💎 Premium/valuable
- 🔮 Mystery/magic

## 📝 License

MIT - See LICENSE file

## 🤝 Contributing

This is the BambiSleep Chat MCP Control Tower - safety-first, intimacy-focused, boundary-aware.

**When contributing:**
1. Safety always wins over engagement
2. Test all changes against safety suite
3. Maintain CyberNeonGothWave aesthetic
4. Document boundary decisions

---

**Built with 🌸 for the BambiSleep Digital Sanctuary** ⚡💎🔮
