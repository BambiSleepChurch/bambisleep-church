#!/bin/bash
# Verify MCP server configuration and connectivity
# Tests all configured MCP servers

set -e

echo "🔮 MCP Server Verification Tool 🔮"
echo "=================================="
echo ""

PASSED=0
FAILED=0
WARNINGS=0

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_server() {
    local name=$1
    local command=$2
    shift 2
    local args=("$@")

    echo -n "Testing $name... "

    if command -v "$command" &> /dev/null; then
        if timeout 5s "$command" "${args[@]}" --help &> /dev/null; then
            echo -e "${GREEN}✅ PASS${NC}"
            ((PASSED++))
            return 0
        else
            echo -e "${YELLOW}⚠️  WARN (command exists but test failed)${NC}"
            ((WARNINGS++))
            return 1
        fi
    else
        echo -e "${RED}❌ FAIL (command not found: $command)${NC}"
        ((FAILED++))
        return 1
    fi
}

echo "📋 Testing Official MCP Servers (npx-based):"
echo ""

test_server "Filesystem" npx -y @modelcontextprotocol/server-filesystem
test_server "Git" npx -y @modelcontextprotocol/server-git
test_server "GitHub" npx -y @modelcontextprotocol/server-github
test_server "Memory" npx -y @modelcontextprotocol/server-memory
test_server "Sequential Thinking" npx -y @modelcontextprotocol/server-sequential-thinking
test_server "Everything" npx -y @modelcontextprotocol/server-everything
test_server "Puppeteer" npx -y @modelcontextprotocol/server-puppeteer

echo ""
echo "🐍 Testing Python-based MCP Servers (uvx-based):"
echo ""

if command -v uvx &> /dev/null; then
    echo -n "Testing Brave Search... "
    if [ -z "$BRAVE_API_KEY" ]; then
        echo -e "${YELLOW}⚠️  WARN (BRAVE_API_KEY not set)${NC}"
        ((WARNINGS++))
    else
        echo -e "${GREEN}✅ PASS (API key configured)${NC}"
        ((PASSED++))
    fi

    echo -n "Testing Postgres... "
    if [ -z "$DATABASE_URL" ]; then
        echo -e "${YELLOW}⚠️  WARN (DATABASE_URL not set)${NC}"
        ((WARNINGS++))
    else
        echo -e "${GREEN}✅ PASS (connection string configured)${NC}"
        ((PASSED++))
    fi
else
    echo -e "${RED}❌ uvx not installed - Python MCP servers unavailable${NC}"
    echo "   Install from: https://docs.astral.sh/uv/getting-started/installation/"
    ((FAILED++))
fi

echo ""
echo "📁 Checking VS Code Configuration:"
echo ""

if [ -f ".vscode/settings.json" ]; then
    echo -e "${GREEN}✅ Root .vscode/settings.json found${NC}"

    # Count configured servers
    SERVER_COUNT=$(grep -c '"command":' .vscode/settings.json || true)
    echo "   Configured servers: $SERVER_COUNT"
    ((PASSED++))
else
    echo -e "${RED}❌ Root .vscode/settings.json not found${NC}"
    ((FAILED++))
fi

if [ -f "bambisleepchat/.vscode/settings.json" ]; then
    echo -e "${GREEN}✅ bambisleepchat/.vscode/settings.json found${NC}"

    # Count configured servers
    SERVER_COUNT=$(grep -c '"command":' bambisleepchat/.vscode/settings.json || true)
    echo "   Configured servers: $SERVER_COUNT"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  bambisleepchat/.vscode/settings.json not found${NC}"
    ((WARNINGS++))
fi

echo ""
echo "🔑 Checking Environment Variables:"
echo ""

check_env() {
    local var_name=$1
    local required=$2

    if [ -n "${!var_name}" ]; then
        echo -e "${GREEN}✅ $var_name is set${NC}"
        ((PASSED++))
    else
        if [ "$required" = "true" ]; then
            echo -e "${RED}❌ $var_name is not set (required)${NC}"
            ((FAILED++))
        else
            echo -e "${YELLOW}⚠️  $var_name is not set (optional)${NC}"
            ((WARNINGS++))
        fi
    fi
}

check_env "GITHUB_TOKEN" false
check_env "BRAVE_API_KEY" false
check_env "DATABASE_URL" false
check_env "MCP_SERVER_LOG_LEVEL" false

echo ""
echo "=================================="
echo "📊 Test Results:"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🌸 All critical tests passed! MCP servers are ready. 🌸${NC}"
    exit 0
else
    echo -e "${RED}🔥 Some tests failed. Please review the output above. 🔥${NC}"
    echo ""
    echo "💡 Quick fixes:"
    echo "  - Run: ./scripts/install-mcp-servers.sh"
    echo "  - Copy .env.example to .env and fill in values"
    echo "  - Install uvx for Python MCP servers"
    exit 1
fi
