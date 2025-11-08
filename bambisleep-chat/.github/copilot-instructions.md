# Copilot Instructions - Bambisleep Chat Project

## Project Overview

This project is developing an AI-powered intimate assistant chatbot with a focus on persona design, safety, and user trust. The work centers on defining architecture, boundaries, and implementation priorities for a conversational AI that maintains appropriate intimacy while enforcing strict ethical guardrails.

### Ecosystem Context

This repository (`bambisleep-chat`) is part of the broader **BambiSleepChat** organization that includes:

- **MCP Control Towers**: Model Context Protocol server management (`js-bambisleep-church`, `bambisleep-church-catgirl-control-tower`)
- **Unity 6.2 Avatar Systems**: CatGirl avatar implementations with MCP integration (`bambisleep-chat-catgirl`, `bambisleep-catgirl-church`)
- **Church Infrastructure**: Digital sanctuary mission with Docker-based deployment (`bambisleep-church`)

This repository focuses on the **planning and architectural foundation** for the conversational AI core that will integrate with these systems.

### Visual Identity

The entire ecosystem follows the **CyberNeonGothWave** aesthetic - a fusion of cyberpunk neon, gothic mysticism, and intimate digital sanctuary vibes. See `.github/COLOR_THEME.md` for complete color specifications.

**Key colors:**

- Background: `#0A0014` (Deep Void)
- Primary text: `#00F0FF` (Cyber Cyan)
- Accents: `#FF006E` (Hot Pink), `#FF10F0` (Neon Purple)
- Success: `#39FF14` (Electric Lime)

When creating any visual documentation, UI mockups, or design specifications, maintain this color palette and aesthetic.

## Key Context & Architecture

### Project Philosophy

- **Persona-first design**: The assistant's personality, boundaries, and conversational style are critical differentiators
- **Safety by design**: Ethics and guardrails are prioritized early to prevent harmful outputs
- **Privacy-conscious**: All memory and personalization features must respect consent and data protection

### Implementation Priority Order

The project follows a specific development sequence (see `guide.md`):

1. Core model & architecture selection
2. Persona and conversation design
3. Safety, ethics, and guardrails
4. Memory and personalization
5. Privacy, data handling, and consent
6. UX: UI, multi-modal I/O (voice, avatar, images)
7. Integration, APIs, and deployment
8. Testing, metrics, and iteration plan

**Why this matters**: Each phase builds on the previous. Don't suggest jumping to UX features or deployment strategies before the persona and safety framework are defined.

## Development Conventions

### Visual & Brand Consistency

- Follow the **CyberNeonGothWave** aesthetic defined in `.github/COLOR_THEME.md`
- All UI mockups, diagrams, and visual specifications must use the official color palette
- Emoji usage: 🌸 (sacred/gentle), ⚡ (energy/cyber), 💎 (premium), 🔮 (mystery)
- Documentation should feel both technical and intimate, matching the project's dual nature

### When Working on Persona Design

- Always include both positive examples (allowed dialogues) and negative examples (disallowed/boundary-crossing scenarios)
- Document specific intimacy boundaries, not just generic "be respectful" guidelines
- Any persona specification must include banned topics and red-line behaviors

### Safety and Ethics Requirements

- **Non-negotiable red lines**: No coercive behavior, no misleading claims, no boundary violations
- Every new conversational feature must consider: "How could this be misused?"
- Incident response plans should be defined before deployment

### Privacy and Data Handling

- Memory features require explicit consent flows
- Document data retention rules for any stored user information
- Cloud vs on-device decisions should consider privacy implications, not just technical capabilities

## Build Instructions

### Unity 6.2 Avatar System

**Technology Stack:**

- Unity 6.2 (LTS recommended)
- C# scripting with .NET Standard 2.1
- Universal Render Pipeline (URP) for neon/glow effects
- VRM/VRoid avatar format support

**Project Structure:**

```
Assets/
├── Scripts/
│   ├── Avatar/          # Character controllers, animations
│   ├── MCP/             # MCP client integration
│   ├── Effects/         # Particle systems, shaders
│   └── UI/              # In-world UI elements
├── Materials/
│   ├── Shaders/         # Custom CyberNeonGothWave shaders
│   └── Textures/        # Avatar skins, emissive maps
├── Prefabs/
│   ├── CatGirl/         # Avatar character prefabs
│   └── Effects/         # Reusable VFX
└── Scenes/
    ├── MainScene.unity  # Primary avatar environment
    └── TestRig.unity    # Animation testing
```

**Key Implementation Patterns:**

1. **Avatar Controller** - Use state machine for emotions/poses:

   ```csharp
   // Example: AvatarStateController.cs
   public enum AvatarState { Idle, Speaking, Listening, Emoting }
   public class AvatarStateController : MonoBehaviour {
       [SerializeField] private Animator animator;
       private AvatarState currentState;

       public void TransitionTo(AvatarState newState) {
           // Handle state transitions with safety checks
           // Emit MCP events for state changes
       }
   }
   ```

2. **MCP Integration** - WebSocket connection to control tower:

   ```csharp
   // Example: MCPClient.cs
   public class MCPClient : MonoBehaviour {
       private WebSocket ws;
       private string mcpServerUrl = "ws://localhost:3000/mcp";

       async void Start() {
           await ConnectToMCP();
       }

       private void OnMessageReceived(string json) {
           // Parse MCP commands, update avatar state
           // Send telemetry back to control tower
       }
   }
   ```

3. **Visual Effects** - Apply CyberNeonGothWave shaders:
   - Use Emission maps with HDR colors (`#00F0FF`, `#FF10F0`)
   - Rim lighting for cyber glow effect
   - Particle systems for energy trails (cyan → purple gradient)
   - Post-processing: Bloom (intensity 0.8), Color Grading (lift shadows to `#1A0A28`)

**Build Commands:**

```bash
# From Unity project root
# Build for Windows Standalone
Unity.exe -quit -batchmode -projectPath . -buildTarget Win64 -buildPath ./Builds/Windows/BambiChat.exe

# Build for WebGL (browser deployment)
Unity.exe -quit -batchmode -projectPath . -buildTarget WebGL -buildPath ./Builds/WebGL
```

**Testing Checklist:**

- [ ] Avatar loads with correct CyberNeonGothWave materials
- [ ] MCP connection establishes within 3 seconds
- [ ] State transitions trigger appropriate animations
- [ ] Emissive effects visible in dark environments
- [ ] Framerate maintains 60fps with all effects enabled

---

### MCP Control Tower (JavaScript/Node.js)

**Technology Stack:**

- Node.js 18+ (LTS)
- TypeScript for type safety
- Model Context Protocol SDK (`@modelcontextprotocol/sdk`)
- WebSocket server (ws package)
- Express.js for REST API

**Project Structure:**

```
mcp-server/
├── src/
│   ├── server.ts           # Main MCP server entry
│   ├── tools/              # MCP tool definitions
│   │   ├── chat.ts         # Chat interface tools
│   │   ├── avatar.ts       # Unity avatar control
│   │   └── memory.ts       # Conversation memory
│   ├── handlers/           # Request handlers
│   ├── middleware/         # Auth, logging, safety
│   └── config/
│       ├── safety.ts       # Guardrails configuration
│       └── personas.ts     # Persona definitions
├── tests/
├── package.json
└── tsconfig.json
```

**Key Implementation Patterns:**

1. **MCP Server Setup**:

   ```typescript
   // src/server.ts
   import { Server } from "@modelcontextprotocol/sdk/server/index.js";
   import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

   const server = new Server(
     {
       name: "bambisleep-church-mcp",
       version: "1.0.0",
     },
     {
       capabilities: {
         tools: {},
         resources: {},
         prompts: {},
       },
     }
   );

   // Register tools for Unity integration
   server.setRequestHandler(ListToolsRequestSchema, async () => ({
     tools: [
       { name: "avatar_set_emotion", description: "..." },
       { name: "chat_send_message", description: "..." },
       { name: "memory_store", description: "..." },
     ],
   }));
   ```

2. **Safety Middleware** - Enforce guardrails before LLM:

   ```typescript
   // src/middleware/safety.ts
   export class SafetyFilter {
     private bannedTopics = ['coercion', 'manipulation', ...];

     async validate(message: string): Promise<ValidationResult> {
       // Check against banned topics
       // Sentiment analysis for boundary violations
       // Log suspicious patterns
       return { safe: true, reason: null };
     }
   }
   ```

3. **Unity Bridge** - Bidirectional communication:

   ```typescript
   // src/handlers/unity-bridge.ts
   import WebSocket from "ws";

   export class UnityBridge {
     private wss: WebSocket.Server;

     sendToAvatar(command: AvatarCommand) {
       this.wss.clients.forEach((client) => {
         if (client.readyState === WebSocket.OPEN) {
           client.send(JSON.stringify(command));
         }
       });
     }

     onAvatarEvent(callback: (event: AvatarEvent) => void) {
       // Handle incoming telemetry from Unity
     }
   }
   ```

**Setup & Run:**

```bash
# Install dependencies
npm install

# Development mode with hot reload
npm run dev

# Build TypeScript
npm run build

# Production mode
npm start

# Run with Docker
docker build -t bambisleep-mcp .
docker run -p 3000:3000 -e NODE_ENV=production bambisleep-mcp
```

**Environment Variables:**

```bash
# .env
NODE_ENV=production
MCP_PORT=3000
UNITY_WS_PORT=3001
LLM_API_KEY=your_key_here
SAFETY_LEVEL=strict
LOG_LEVEL=info
```

**Testing Checklist:**

- [ ] MCP tools register correctly (use MCP inspector)
- [ ] Safety filters block banned topics
- [ ] Unity WebSocket connections stable
- [ ] Conversation memory persists across sessions
- [ ] Error handling logs to monitoring system

---

### Chat Interface (Web/Desktop)

**Technology Stack:**

- Frontend: React 18+ or Vue 3 (TypeScript)
- Styling: Tailwind CSS with custom CyberNeonGothWave theme
- State Management: Zustand or Pinia
- WebSocket: Socket.io-client for real-time
- Voice: Web Speech API or Azure Speech SDK

**Project Structure:**

```
chat-interface/
├── src/
│   ├── components/
│   │   ├── ChatWindow.tsx      # Main chat container
│   │   ├── MessageBubble.tsx   # Individual messages
│   │   ├── InputBar.tsx        # User input with voice
│   │   └── AvatarView.tsx      # Embedded Unity WebGL
│   ├── services/
│   │   ├── mcp-client.ts       # MCP connection
│   │   ├── speech.ts           # Voice I/O
│   │   └── memory.ts           # Local storage
│   ├── styles/
│   │   └── cyber-theme.css     # CyberNeonGothWave
│   └── App.tsx
├── public/
└── package.json
```

**Key Implementation Patterns:**

1. **Chat Component** - CyberNeonGothWave styling:

   ```tsx
   // src/components/ChatWindow.tsx
   export const ChatWindow = () => {
     const [messages, setMessages] = useState<Message[]>([]);

     return (
       <div className="chat-window bg-[#0A0014] border-[#FF10F0] border-2">
         <div className="messages-container">
           {messages.map((msg) => (
             <MessageBubble
               key={msg.id}
               message={msg}
               className={
                 msg.role === "user"
                   ? "bg-[#1A0A28] text-[#00F0FF]"
                   : "bg-[#0D001A] text-[#00FFD4]"
               }
             />
           ))}
         </div>
       </div>
     );
   };
   ```

2. **MCP Client Integration**:

   ```typescript
   // src/services/mcp-client.ts
   import { Client } from "@modelcontextprotocol/sdk/client/index.js";

   export class MCPChatClient {
     private client: Client;

     async sendMessage(text: string): Promise<string> {
       // Call MCP tool: chat_send_message
       const result = await this.client.callTool({
         name: "chat_send_message",
         arguments: { text, userId: this.userId },
       });

       return result.content;
     }

     async updateAvatarEmotion(emotion: string) {
       await this.client.callTool({
         name: "avatar_set_emotion",
         arguments: { emotion },
       });
     }
   }
   ```

3. **Voice Integration** - Bidirectional speech:

   ```typescript
   // src/services/speech.ts
   export class VoiceService {
     private recognition: SpeechRecognition;
     private synthesis: SpeechSynthesis;

     startListening(onTranscript: (text: string) => void) {
       this.recognition.onresult = (event) => {
         const transcript = event.results[0][0].transcript;
         onTranscript(transcript);
       };
       this.recognition.start();
     }

     speak(text: string, voice: "sultry" | "gentle" = "gentle") {
       const utterance = new SpeechSynthesisUtterance(text);
       utterance.pitch = voice === "sultry" ? 0.8 : 1.0;
       utterance.rate = 0.9;
       this.synthesis.speak(utterance);
     }
   }
   ```

4. **Tailwind Theme Configuration**:
   ```javascript
   // tailwind.config.js
   module.exports = {
     theme: {
       extend: {
         colors: {
           void: { DEFAULT: "#0A0014", light: "#1A0A28", deep: "#0D001A" },
           cyber: { cyan: "#00F0FF", ice: "#00D9FF", aqua: "#00FFD4" },
           neon: { pink: "#FF006E", purple: "#FF10F0", magenta: "#FF1493" },
           electric: { lime: "#39FF14", chartreuse: "#7FFF00" },
         },
         boxShadow: {
           "neon-pink": "0 0 20px rgba(255, 0, 110, 0.6)",
           "neon-cyan": "0 0 20px rgba(0, 240, 255, 0.6)",
         },
       },
     },
   };
   ```

**Build & Deploy:**

```bash
# Development
npm run dev

# Production build
npm run build

# Deploy to static hosting (Netlify/Vercel)
npm run deploy

# Build Electron desktop app
npm run build:electron
```

**Testing Checklist:**

- [ ] CyberNeonGothWave colors render correctly
- [ ] Messages send/receive in under 500ms
- [ ] Voice input transcribes accurately
- [ ] Avatar emotion syncs with conversation
- [ ] Works in Chrome, Firefox, Edge (latest)
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] Accessibility: keyboard navigation, ARIA labels

---

### Cross-Component Integration

**Data Flow:**

```
User Input (Chat Interface)
  → WebSocket → MCP Control Tower
  → Safety Filter → LLM Processing
  → Persona Enforcement → Response Generation
  → Unity Avatar Update (emotion, animation)
  → Chat Interface Display
```

**Shared Configuration:**

- Use `.env` files for environment-specific settings
- Centralize persona definitions in MCP server
- Unity and Chat Interface both consume MCP tools
- All components must respect safety guardrails

**Deployment Architecture:**

```
┌─────────────────┐
│  Chat Interface │ (Static hosting or Electron)
│  (React/Vue)    │
└────────┬────────┘
         │ WebSocket
         ▼
┌─────────────────┐
│  MCP Control    │ (Node.js server)
│  Tower          │ Port 3000
└────┬────────┬───┘
     │        │
     │        └─── WebSocket ───┐
     │                          ▼
     │                  ┌───────────────┐
     └─── REST API ───► │ Unity Avatar  │
                        │ (WebGL/Native)│
                        └───────────────┘
```

**Development Workflow:**

1. Start MCP server: `cd mcp-server && npm run dev`
2. Start Unity editor: Open project, press Play
3. Start chat interface: `cd chat-interface && npm run dev`
4. Test integration: Send message, verify avatar responds
5. Monitor logs: Check MCP server console for safety violations

## Current Project State

This is an early-stage planning project. The codebase currently contains:

- `guide.md`: Priority framework and architectural decisions for building the assistant

### Integration Points (Future)

When implementation begins, expect integration with:

- **MCP servers** (JavaScript/Node.js) for orchestration and server management
- **Unity 6.2** for avatar rendering and visual interaction
- **Docker infrastructure** for deployment and scaling
- **Universal Banking system** (mentioned in organization repos - purpose TBD)

When suggesting next steps:

- Recognize this is pre-implementation planning phase
- Recommend concrete artifacts aligned with current priority (likely persona specs or safety requirements)
- Consider how decisions will affect MCP server integration and Unity avatar systems
- Avoid suggesting code implementation before design decisions are documented

## Key Decision Signals

Stop and reassess if:

- Users report confusing or boundary-crossing behavior (indicates persona design failure)
- Any privacy/data-leak concerns emerge (indicates insufficient safety framework)
- Low trust or safety incidents in metrics (indicates need to revisit priorities 1-3)

## Anti-Patterns to Avoid

- Don't suggest generic "best practices" without connecting to this project's specific intimacy/safety context
- Don't recommend skipping ahead to deployment/scaling before core model and persona are validated
- Don't propose features without considering safety and consent implications
- Don't assume standalone deployment - this will integrate with MCP servers and Unity avatar systems
- Don't suggest breaking the priority sequence (model → persona → safety → memory → privacy → UX → integration → testing)
