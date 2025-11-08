#!/usr/bin/env node
/**
 * MCP HTTP API Server
 *
 * External service that exposes MCP agents via HTTP REST API.
 * This runs independently from the Reddit app and provides AI-powered analysis.
 *
 * Usage:
 *   node mcp-integration/examples/http-api-server.js
 *
 * Environment Variables:
 *   PORT - Server port (default: 3000)
 *   API_KEY - Optional API key for authentication
 *   NODE_ENV - Environment (development/production)
 */

const express = require("express");
const { ModAssistant, SpamDetector } = require("../index");

// Configuration
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || null;
const isDev = process.env.NODE_ENV !== "production";

// Initialize Express
const app = express();
app.use(express.json());

// Initialize MCP agents
let modAssistant = null;
let spamDetector = null;

// Simple authentication middleware
function authenticate(req, res, next) {
  if (!API_KEY) {
    return next(); // No auth in development
  }

  const providedKey = req.headers["x-api-key"];
  if (providedKey !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}

// Logging middleware
app.use((req, res, next) => {
  console.log(`🌸 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    agents: {
      modAssistant: !!modAssistant,
      spamDetector: !!spamDetector,
    },
  });
});

// Initialize agents endpoint
app.post("/initialize", authenticate, async (req, res) => {
  try {
    console.log("🔮 Initializing MCP agents...");

    modAssistant = new ModAssistant();
    await modAssistant.initialize();

    spamDetector = new SpamDetector();
    await spamDetector.initialize();

    console.log("✅ MCP agents initialized");

    res.json({
      success: true,
      message: "Agents initialized successfully",
    });
  } catch (error) {
    console.error("🔥 Initialization failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Analyze single comment endpoint
app.post("/analyze", authenticate, async (req, res) => {
  try {
    const { commentId, commentBody, commentAuthor, subredditName } = req.body;

    // Validate request
    if (!commentId || !commentBody) {
      return res.status(400).json({
        error: "Missing required fields: commentId, commentBody",
      });
    }

    console.log(`🔮 Analyzing comment ${commentId}...`);

    // Initialize agents if not already done
    if (!modAssistant || !spamDetector) {
      console.log("⚠️ Agents not initialized, initializing now...");
      modAssistant = new ModAssistant();
      await modAssistant.initialize();
      spamDetector = new SpamDetector();
      await spamDetector.initialize();
    }

    const startTime = Date.now();

    // Run both analyses in parallel
    const [modResult, spamResult] = await Promise.all([
      modAssistant.analyzeComment({
        id: commentId,
        body: commentBody,
        author: commentAuthor || "unknown",
        subreddit: subredditName || "unknown",
      }),
      spamDetector.analyzeComment({
        id: commentId,
        body: commentBody,
        author: commentAuthor || "unknown",
        subreddit: subredditName || "unknown",
      }),
    ]);

    const processingTime = Date.now() - startTime;

    // Combine results
    const result = {
      commentId,
      spam: {
        isSpam: spamResult.isSpam || false,
        confidence: spamResult.confidence || 0,
        reasons: spamResult.reasons || [],
      },
      toxicity: {
        isToxic: modResult.toxicity?.isToxic || false,
        score: modResult.toxicity?.score || 0,
        categories: modResult.toxicity?.categories || [],
      },
      recommendations: {
        action: determineAction(modResult, spamResult),
        reason: combineReasons(modResult, spamResult),
        confidence: Math.max(modResult.confidence || 0, spamResult.confidence || 0),
      },
      metadata: {
        analyzedAt: new Date().toISOString(),
        model: "mcp-agents-v1",
        processingTime,
      },
    };

    console.log(`✨ Analysis complete: ${result.recommendations.action} (${processingTime}ms)`);

    res.json(result);
  } catch (error) {
    console.error("🔥 Analysis failed:", error);
    res.status(500).json({
      error: "Analysis failed",
      message: error.message,
    });
  }
});

// Batch analyze endpoint
app.post("/analyze/batch", authenticate, async (req, res) => {
  try {
    const { comments } = req.body;

    if (!Array.isArray(comments) || comments.length === 0) {
      return res.status(400).json({
        error: "Missing or invalid comments array",
      });
    }

    console.log(`🔮 Batch analyzing ${comments.length} comments...`);

    // Initialize agents if not already done
    if (!modAssistant || !spamDetector) {
      modAssistant = new ModAssistant();
      await modAssistant.initialize();
      spamDetector = new SpamDetector();
      await spamDetector.initialize();
    }

    const startTime = Date.now();

    // Analyze all comments in parallel
    const results = await Promise.all(
      comments.map(async (comment) => {
        const [modResult, spamResult] = await Promise.all([
          modAssistant.analyzeComment({
            id: comment.commentId,
            body: comment.commentBody,
            author: comment.commentAuthor || "unknown",
            subreddit: comment.subredditName || "unknown",
          }),
          spamDetector.analyzeComment({
            id: comment.commentId,
            body: comment.commentBody,
            author: comment.commentAuthor || "unknown",
            subreddit: comment.subredditName || "unknown",
          }),
        ]);

        return {
          commentId: comment.commentId,
          spam: {
            isSpam: spamResult.isSpam || false,
            confidence: spamResult.confidence || 0,
            reasons: spamResult.reasons || [],
          },
          toxicity: {
            isToxic: modResult.toxicity?.isToxic || false,
            score: modResult.toxicity?.score || 0,
            categories: modResult.toxicity?.categories || [],
          },
          recommendations: {
            action: determineAction(modResult, spamResult),
            reason: combineReasons(modResult, spamResult),
            confidence: Math.max(modResult.confidence || 0, spamResult.confidence || 0),
          },
          metadata: {
            analyzedAt: new Date().toISOString(),
            model: "mcp-agents-v1",
            processingTime: Date.now() - startTime,
          },
        };
      })
    );

    const processingTime = Date.now() - startTime;

    console.log(`✨ Batch analysis complete: ${comments.length} comments (${processingTime}ms)`);

    res.json({
      results,
      metadata: {
        totalComments: comments.length,
        processingTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("🔥 Batch analysis failed:", error);
    res.status(500).json({
      error: "Batch analysis failed",
      message: error.message,
    });
  }
});

// Helper: Determine action based on analysis results
function determineAction(modResult, spamResult) {
  if (spamResult.isSpam && spamResult.confidence > 0.7) {
    return "remove";
  }

  if (modResult.toxicity?.isToxic && modResult.toxicity.score > 0.8) {
    return "remove";
  }

  if (spamResult.isSpam || modResult.toxicity?.isToxic) {
    return "flag";
  }

  return "approve";
}

// Helper: Combine reasons from both analyses
function combineReasons(modResult, spamResult) {
  const reasons = [];

  if (spamResult.isSpam) {
    reasons.push(...(spamResult.reasons || ["Detected as spam"]));
  }

  if (modResult.toxicity?.isToxic) {
    reasons.push(`Toxic content (score: ${modResult.toxicity.score})`);
  }

  if (reasons.length === 0) {
    return "Content appears safe";
  }

  return reasons.join("; ");
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("🔥 Server error:", error);
  res.status(500).json({
    error: "Internal server error",
    message: isDev ? error.message : "Something went wrong",
  });
});

// Start server
app.listen(PORT, () => {
  console.log("");
  console.log("🌸 MCP HTTP API Server Started ✨");
  console.log("");
  console.log(`📡 Listening on port ${PORT}`);
  console.log(`🔐 Authentication: ${API_KEY ? "Enabled" : "Disabled"}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("");
  console.log("Available endpoints:");
  console.log(`  GET  /health - Health check`);
  console.log(`  POST /initialize - Initialize agents`);
  console.log(`  POST /analyze - Analyze single comment`);
  console.log(`  POST /analyze/batch - Batch analyze comments`);
  console.log("");
  console.log("💡 Test with:");
  console.log(`  curl http://localhost:${PORT}/health`);
  console.log("");
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("");
  console.log("🌸 Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("");
  console.log("🌸 Shutting down gracefully...");
  process.exit(0);
});
