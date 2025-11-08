// 🌸 MCP Integration Framework - Main Entry Point
// Central export point for all agents and workflows

// Agents
const BaseAgent = require("./agents/base-agent");
const ModAssistant = require("./agents/mod-assistant");
const SpamDetector = require("./agents/spam-detector");
const WorkflowOrchestrator = require("./agents/workflow-orchestrator");
const RAGAgent = require("./agents/rag-agent");
const CAGAgent = require("./agents/cag-agent");

// Workflows
const { autoModerate, batchAutoModerate, AUTO_MOD_CONFIG } = require("./workflows/auto-mod");

// Configuration loader
function loadConfig(configPath = "./config/mcp-reddit.json") {
  try {
    return require(configPath);
  } catch (error) {
    console.warn("⚠️ MCP: Config not found, using defaults");
    return require("./config/mcp-reddit.example.json");
  }
}

module.exports = {
  // Agents
  BaseAgent,
  ModAssistant,
  SpamDetector,
  WorkflowOrchestrator,
  RAGAgent,
  CAGAgent,

  // Workflows
  autoModerate,
  batchAutoModerate,
  AUTO_MOD_CONFIG,

  // Config
  loadConfig,
};
