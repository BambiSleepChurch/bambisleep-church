# Build Instructions

## MCP Server Setup

### Install Essential MCP Servers
```bash
# Official servers via npm
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-git  
npm install -g @modelcontextprotocol/server-github
npm install -g @modelcontextprotocol/server-memory
npm install -g @modelcontextprotocol/server-sequential-thinking
npm install -g @modelcontextprotocol/server-everything

# Python-based servers via uvx
uvx --install mcp-server-brave-search
uvx --install mcp-server-postgres
uvx --install mcp-server-sqlite
```

### VS Code MCP Configuration
Add to `.vscode/settings.json`:

```json
{
  "mcp.servers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"]
    },
    "git": {
      "command": "npx", 
      "args": ["-y", "@modelcontextprotocol/server-git", "--repository", "/workspace"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "everything": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-everything"]
    }
  }
}
```

## Unity Project Setup

### Create Unity Project Structure
```bash
mkdir -p catgirl-avatar-project/{Assets,ProjectSettings,Packages,Logs,Temp,UserSettings}
cd catgirl-avatar-project

# Initialize Unity project structure
cat > ProjectSettings/ProjectVersion.txt << 'EOF'
m_EditorVersion: 6000.2.11f1
m_EditorVersionWithRevision: 6000.2.11f1 (0773b680dc03)
EOF

# Create essential directories
mkdir -p Assets/{Scripts,Materials,Textures,Models,Animations,Prefabs,UI,Audio,Scenes}
mkdir -p Assets/Scripts/{Character,Inventory,Economy,Networking,UI,Audio}
```

### Package Dependencies (Packages/manifest.json)
```json
{
  "dependencies": {
    "com.unity.addressables": "2.3.1",
    "com.unity.animation.rigging": "1.3.1", 
    "com.unity.cinemachine": "2.10.1",
    "com.unity.netcode.gameobjects": "2.0.0",
    "com.unity.services.analytics": "5.1.1",
    "com.unity.services.authentication": "3.3.4",
    "com.unity.services.core": "1.15.0",
    "com.unity.services.economy": "3.4.2",
    "com.unity.timeline": "1.8.7",
    "com.unity.ui.toolkit": "2.0.0",
    "com.unity.purchasing": "4.12.2"
  }
}
```

## Development Environment

### Node.js Setup
```bash
# Install Node.js 20 LTS with Volta
volta install node@20-lts
volta pin node@20-lts
```

### Build Commands (from RELIGULOUS_MANTRA.md)
```bash
# Test with 100% coverage
npm test -- --coverage=100

# Universal build
npm run build -- --universal

# Deploy with AIGF mode
npm run deploy -- --aigf-mode
```

## Container Build

### Container Labels
```dockerfile
LABEL org.opencontainers.image.vendor="BambiSleepChat"
LABEL org.opencontainers.image.source="https://github.com/BambiSleepChat/bambisleep-church"
LABEL org.opencontainers.image.title="BambiSleep Church MCP Control Tower"
LABEL org.bambi.trademark="BambiSleep™ is a trademark of BambiSleepChat"
```

### Container Registry
Push to: `ghcr.io/bambisleepchat/bambisleep-church`

Tagging convention:
- `latest` - Latest stable release
- `main` - Latest main branch build  
- `v{major}.{minor}.{patch}` - Semantic version releases
- `dev-{branch}` - Development branches