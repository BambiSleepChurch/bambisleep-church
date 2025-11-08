#!/bin/bash
# Install all essential MCP servers for BambiSleep Church development
# Based on MCP_SETUP_GUIDE.md

set -e

echo "🌸 Installing MCP servers for BambiSleep™ Church development... ✨"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 20+ first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm first."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "⚠️  Node.js version is $NODE_VERSION. Recommended: 20+"
fi

echo "✅ Node.js $(node --version) and npm $(npm --version) detected"
echo ""

# Official MCP servers via npx (no installation needed - on-demand)
echo "🌸 Testing official MCP servers (via npx)..."

# Test filesystem server
echo "  Testing filesystem server..."
if npx -y @modelcontextprotocol/server-filesystem --help &> /dev/null; then
    echo "  ✅ Filesystem server ready"
else
    echo "  ⚠️  Filesystem server test failed (may still work in VS Code)"
fi

# Test git server
echo "  Testing git server..."
if npx -y @modelcontextprotocol/server-git --help &> /dev/null; then
    echo "  ✅ Git server ready"
else
    echo "  ⚠️  Git server test failed (may still work in VS Code)"
fi

# Test GitHub server
echo "  Testing GitHub server..."
if npx -y @modelcontextprotocol/server-github --help &> /dev/null; then
    echo "  ✅ GitHub server ready"
else
    echo "  ⚠️  GitHub server test failed (may still work in VS Code)"
fi

# Test memory server
echo "  Testing memory server..."
if npx -y @modelcontextprotocol/server-memory --help &> /dev/null; then
    echo "  ✅ Memory server ready"
else
    echo "  ⚠️  Memory server test failed (may still work in VS Code)"
fi

# Test sequential thinking server
echo "  Testing sequential-thinking server..."
if npx -y @modelcontextprotocol/server-sequential-thinking --help &> /dev/null; then
    echo "  ✅ Sequential-thinking server ready"
else
    echo "  ⚠️  Sequential-thinking server test failed (may still work in VS Code)"
fi

# Test everything server
echo "  Testing everything server..."
if npx -y @modelcontextprotocol/server-everything --help &> /dev/null; then
    echo "  ✅ Everything server ready"
else
    echo "  ⚠️  Everything server test failed (may still work in VS Code)"
fi

# Test puppeteer server
echo "  Testing puppeteer server..."
if npx -y @modelcontextprotocol/server-puppeteer --help &> /dev/null; then
    echo "  ✅ Puppeteer server ready"
else
    echo "  ⚠️  Puppeteer server test failed (may still work in VS Code)"
fi

echo ""

# Python-based servers via uvx (requires uv)
echo "🔮 Checking Python-based MCP servers (via uvx)..."

if command -v uvx &> /dev/null; then
    echo "  ✅ uvx detected"

    # Note: brave-search requires API key
    echo "  ℹ️  Brave Search server requires BRAVE_API_KEY environment variable"
    echo "     Get API key from: https://brave.com/search/api/"

    # Note: postgres requires database connection
    echo "  ℹ️  Postgres server requires DATABASE_URL environment variable"
    echo "     Example: postgresql://localhost:5432/bambisleep"
else
    echo "  ⚠️  uvx not found. Python-based servers (brave-search, postgres) unavailable."
    echo "     Install uv from: https://docs.astral.sh/uv/getting-started/installation/"
fi

echo ""
echo "💎 MCP server setup complete! 💎"
echo ""
echo "📋 Next steps:"
echo "  1. Open this project in VS Code"
echo "  2. VS Code will automatically use MCP servers from .vscode/settings.json"
echo "  3. Check MCP status: Ctrl+Shift+P → 'MCP: Show Server Status'"
echo "  4. Set environment variables if needed:"
echo "     - BRAVE_API_KEY for Brave Search"
echo "     - DATABASE_URL for Postgres"
echo ""
echo "✨ Configuration files:"
echo "  - Repository root: .vscode/settings.json (8 servers)"
echo "  - bambisleepchat/: .vscode/settings.json (8 servers)"
echo ""
echo "🦋 Ready for AI-powered development! 🦋"
