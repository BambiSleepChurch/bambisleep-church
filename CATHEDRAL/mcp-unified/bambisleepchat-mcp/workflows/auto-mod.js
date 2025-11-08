// 🌸 Auto-Moderation Workflow
// Automated moderation based on configurable rules

const ModAssistant = require("../agents/mod-assistant");
const SpamDetector = require("../agents/spam-detector");

/**
 * Auto-moderation workflow configuration
 */
const AUTO_MOD_CONFIG = {
  rules: [
    {
      name: "keyword-filter",
      type: "content",
      action: "remove",
      keywords: ["spam", "scam", "buy now", "click here"],
      caseSensitive: false,
    },
    {
      name: "rate-limit",
      type: "user",
      action: "flag",
      threshold: 10, // comments
      timeWindow: 300, // seconds
    },
    {
      name: "new-account-links",
      type: "pattern",
      action: "flag",
      conditions: {
        accountAge: 7, // days
        hasLinks: true,
      },
    },
  ],
  actions: {
    remove: async (content) => {
      console.log(`🔥 AUTO-MOD: Removing ${content.id}`);
      // await content.remove();
    },
    flag: async (content) => {
      console.log(`⚠️ AUTO-MOD: Flagging ${content.id} for review`);
      // Add to modqueue
    },
    lock: async (content) => {
      console.log(`🔒 AUTO-MOD: Locking ${content.id}`);
      // await content.lock();
    },
  },
};

/**
 * Execute auto-moderation workflow
 *
 * @param {object} content - Comment or post to moderate
 * @param {object} context - Additional context (user history, etc.)
 * @returns {Promise<object>} - Moderation result
 */
async function autoModerate(content, context = {}) {
  console.log(`🌸 AUTO-MOD: Processing ${content.id}`);

  const results = {
    contentId: content.id,
    rulesTriggered: [],
    actionsTaken: [],
    timestamp: new Date().toISOString(),
  };

  // Check each rule
  for (const rule of AUTO_MOD_CONFIG.rules) {
    const triggered = await checkRule(rule, content, context);

    if (triggered) {
      results.rulesTriggered.push(rule.name);

      // Execute action
      const actionFn = AUTO_MOD_CONFIG.actions[rule.action];
      if (actionFn) {
        await actionFn(content);
        results.actionsTaken.push(rule.action);
      }
    }
  }

  if (results.rulesTriggered.length === 0) {
    console.log(`✅ AUTO-MOD: Content clean ${content.id}`);
  } else {
    console.log(`⚠️ AUTO-MOD: Triggered ${results.rulesTriggered.length} rules`);
  }

  return results;
}

/**
 * Check if content triggers a rule
 */
async function checkRule(rule, content, context) {
  switch (rule.type) {
    case "content":
      return checkContentRule(rule, content);

    case "user":
      return checkUserRule(rule, content, context);

    case "pattern":
      return checkPatternRule(rule, content, context);

    default:
      console.warn(`⚠️ Unknown rule type: ${rule.type}`);
      return false;
  }
}

/**
 * Check content-based rule (keywords, etc.)
 */
function checkContentRule(rule, content) {
  if (rule.keywords) {
    const text = (content.body || content.selftext || "").toLowerCase();

    for (const keyword of rule.keywords) {
      const searchTerm = rule.caseSensitive ? keyword : keyword.toLowerCase();
      if (text.includes(searchTerm)) {
        console.log(`🔍 AUTO-MOD: Keyword matched: "${keyword}"`);
        return true;
      }
    }
  }

  return false;
}

/**
 * Check user-based rule (rate limiting, etc.)
 */
function checkUserRule(rule, content, context) {
  if (rule.name === "rate-limit") {
    const userHistory = context.userHistory || [];
    const recentComments = userHistory.filter(
      (c) => Date.now() - new Date(c.created).getTime() < rule.timeWindow * 1000
    );

    if (recentComments.length >= rule.threshold) {
      console.log(`⚠️ AUTO-MOD: Rate limit exceeded: ${recentComments.length} comments`);
      return true;
    }
  }

  return false;
}

/**
 * Check pattern-based rule
 */
function checkPatternRule(rule, content, context) {
  if (rule.name === "new-account-links") {
    const accountAge = context.accountAge || Infinity;
    const hasLinks = /https?:\/\//.test(content.body || content.selftext || "");

    if (accountAge < rule.conditions.accountAge && hasLinks) {
      console.log(`⚠️ AUTO-MOD: New account with links (${accountAge} days)`);
      return true;
    }
  }

  return false;
}

/**
 * Batch auto-moderation for multiple items
 */
async function batchAutoModerate(contents, context = {}) {
  console.log(`🦋 AUTO-MOD: Batch processing ${contents.length} items`);

  const results = [];

  for (const content of contents) {
    try {
      const result = await autoModerate(content, context);
      results.push(result);
    } catch (error) {
      console.error(`🔥 AUTO-MOD: Failed to process ${content.id}:`, error);
      results.push({
        contentId: content.id,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  const actioned = results.filter((r) => r.actionsTaken && r.actionsTaken.length > 0).length;
  console.log(`💎 AUTO-MOD: Batch complete - ${actioned}/${contents.length} actioned`);

  return results;
}

module.exports = {
  autoModerate,
  batchAutoModerate,
  AUTO_MOD_CONFIG,
};
