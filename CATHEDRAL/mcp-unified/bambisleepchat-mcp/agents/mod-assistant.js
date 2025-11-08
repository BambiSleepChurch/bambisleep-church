// 🌸 ModAssistant - AI-powered moderation assistant
// Uses sequential-thinking and memory MCP servers for intelligent mod suggestions

const BaseAgent = require("./base-agent");

/**
 * ModAssistant - Intelligent moderation assistant using MCP
 *
 * Features:
 * - Context-aware moderation suggestions
 * - Historical pattern analysis
 * - Automated removal reason generation
 * - User behavior analysis
 *
 * @extends BaseAgent
 */
class ModAssistant extends BaseAgent {
  constructor(config = {}) {
    const defaultConfig = {
      mcpServers: ["sequential-thinking", "memory"],
      priority: "high",
      features: {
        contextAnalysis: true,
        actionSuggestion: true,
        removalReasons: true,
        userHistory: true,
      },
    };

    super("mod-assistant", { ...defaultConfig, ...config });
  }

  /**
   * Analyze comment and suggest moderation action
   *
   * @param {object} comment - Reddit comment object
   * @returns {Promise<object>} - Analysis result with suggested action
   *
   * @example
   * const assistant = new ModAssistant();
   * await assistant.initialize();
   * const result = await assistant.analyzeComment({
   *   id: 't1_abc123',
   *   body: 'This is spam!',
   *   author: 'test_user',
   *   subreddit: 'test'
   * });
   */
  async analyzeComment(comment) {
    this.log("INFO", `🌸 Analyzing comment: ${comment.id}`);

    try {
      // Step 1: Use sequential-thinking for context analysis
      const contextAnalysis = await this.callMcp("sequential-thinking", {
        query: `Analyze this Reddit comment for moderation:
        Content: "${comment.body}"
        Author: ${comment.author}
        Context: ${comment.subreddit}

        Provide moderation recommendation.`,
        steps: 10,
      });

      // Step 2: Check memory for user history
      const userHistory = await this.callMcp("memory", {
        action: "retrieve",
        key: `user_${comment.author}`,
        context: "moderation_history",
      });

      // Step 3: Generate recommendation
      const recommendation = this.generateRecommendation(comment, contextAnalysis, userHistory);

      this.log("INFO", `💎 Analysis complete: ${recommendation.action}`);
      return recommendation;
    } catch (error) {
      this.log("ERROR", `🔥 Analysis failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate moderation recommendation based on analysis
   */
  generateRecommendation(comment, contextAnalysis, userHistory) {
    // Simplified recommendation logic
    // In production, this would use ML models and complex heuristics

    const recommendation = {
      commentId: comment.id,
      timestamp: new Date().toISOString(),
      action: "approve", // approve | remove | lock | flag
      confidence: 0.85,
      reason: "",
      removalReason: null,
      metadata: {
        contextScore: 0.5,
        historyScore: 0.5,
        riskLevel: "low",
      },
    };

    // Check for spam patterns
    const spamKeywords = ["spam", "scam", "click here", "buy now"];
    const hasSpam = spamKeywords.some((kw) => comment.body.toLowerCase().includes(kw));

    if (hasSpam) {
      recommendation.action = "remove";
      recommendation.confidence = 0.95;
      recommendation.reason = "Spam detected";
      recommendation.removalReason = this.generateRemovalReason("spam");
      recommendation.metadata.riskLevel = "high";
    }

    // Store interaction in memory for future reference
    this.storeInteraction(comment, recommendation);

    return recommendation;
  }

  /**
   * Generate removal reason text
   */
  generateRemovalReason(type) {
    const reasons = {
      spam: "Your comment has been removed for spam. Please review our community guidelines.",
      toxicity: "Your comment has been removed for violating our civility rules.",
      offtopic: "Your comment has been removed as off-topic for this discussion.",
      personal: "Your comment has been removed for containing personal information.",
    };

    return reasons[type] || "Your comment has been removed by a moderator.";
  }

  /**
   * Store interaction in memory MCP server
   */
  async storeInteraction(comment, recommendation) {
    try {
      await this.callMcp("memory", {
        action: "store",
        key: `user_${comment.author}`,
        data: {
          commentId: comment.id,
          action: recommendation.action,
          timestamp: new Date().toISOString(),
        },
        context: "moderation_history",
      });

      this.log("DEBUG", `✨ Stored interaction for user: ${comment.author}`);
    } catch (error) {
      this.log("WARN", `⚠️ Failed to store interaction: ${error.message}`);
    }
  }

  /**
   * Analyze entire post thread
   *
   * @param {object} post - Reddit post object
   * @returns {Promise<object>} - Thread analysis with recommendations
   */
  async analyzeThread(post) {
    this.log("INFO", `🌸 Analyzing thread: ${post.id}`);

    try {
      const threadAnalysis = await this.callMcp("sequential-thinking", {
        query: `Analyze this Reddit post for moderation patterns:
        Title: "${post.title}"
        Content: "${post.selftext}"
        Subreddit: ${post.subreddit}
        Comments: ${post.num_comments}

        Identify potential moderation issues.`,
        steps: 15,
      });

      const recommendations = {
        postId: post.id,
        timestamp: new Date().toISOString(),
        overallRisk: "low",
        suggestedActions: [],
        monitoring: false,
      };

      // Add monitoring flag if needed
      if (post.num_comments > 100) {
        recommendations.monitoring = true;
        recommendations.suggestedActions.push({
          action: "monitor",
          reason: "High activity - suggest active monitoring",
        });
      }

      this.log("INFO", `💎 Thread analysis complete`);
      return recommendations;
    } catch (error) {
      this.log("ERROR", `🔥 Thread analysis failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user moderation history
   */
  async getUserHistory(username) {
    try {
      const history = await this.callMcp("memory", {
        action: "retrieve",
        key: `user_${username}`,
        context: "moderation_history",
      });

      this.log("INFO", `💎 Retrieved history for: ${username}`);
      return history;
    } catch (error) {
      this.log("WARN", `⚠️ No history found for: ${username}`);
      return null;
    }
  }
}

module.exports = ModAssistant;
