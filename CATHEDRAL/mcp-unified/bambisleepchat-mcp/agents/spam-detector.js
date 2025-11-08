// 🔥 SpamDetector - Real-time spam detection agent
// Uses brave-search and puppeteer MCP servers for link and account verification

const BaseAgent = require("./base-agent");

/**
 * SpamDetector - Intelligent spam detection using MCP
 *
 * Features:
 * - Link verification and reputation checking
 * - Account age and karma analysis
 * - Coordinated activity detection
 * - Domain blacklist/whitelist management
 *
 * @extends BaseAgent
 */
class SpamDetector extends BaseAgent {
  constructor(config = {}) {
    const defaultConfig = {
      mcpServers: ["brave-search", "puppeteer"],
      priority: "high",
      blacklist: [],
      whitelist: ["reddit.com", "imgur.com", "youtube.com"],
      thresholds: {
        spam: 0.8,
        suspiciousLinks: 3,
        accountAgeMin: 7, // days
      },
    };

    super("spam-detector", { ...defaultConfig, ...config });
    this.blacklist = new Set(this.config.blacklist);
    this.whitelist = new Set(this.config.whitelist);
  }

  /**
   * Analyze content for spam
   *
   * @param {object} content - Comment or post object
   * @returns {Promise<object>} - Spam analysis result
   */
  async analyzeContent(content) {
    this.log("INFO", `🔥 Analyzing content: ${content.id}`);

    try {
      const links = this.extractLinks(content.body || content.selftext);
      const linkAnalysis = await this.analyzeLinks(links);
      const accountAnalysis = await this.analyzeAccount(content.author);

      const spamScore = this.calculateSpamScore(linkAnalysis, accountAnalysis);

      const result = {
        contentId: content.id,
        timestamp: new Date().toISOString(),
        isSpam: spamScore > this.config.thresholds.spam,
        spamScore,
        confidence: 0.9,
        reasons: [],
        details: {
          links: linkAnalysis,
          account: accountAnalysis,
        },
      };

      if (result.isSpam) {
        result.reasons = this.generateReasons(linkAnalysis, accountAnalysis);
        this.log("WARN", `⚠️ Spam detected: ${content.id} (score: ${spamScore})`);
      } else {
        this.log("INFO", `✅ Content clean: ${content.id}`);
      }

      return result;
    } catch (error) {
      this.log("ERROR", `🔥 Analysis failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extract URLs from text
   */
  extractLinks(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex) || [];
    return matches
      .map((url) => {
        try {
          return new URL(url);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  }

  /**
   * Analyze links using brave-search and puppeteer
   */
  async analyzeLinks(links) {
    if (links.length === 0) {
      return { clean: true, suspicious: [], blacklisted: [] };
    }

    this.log("INFO", `🔍 Analyzing ${links.length} links`);

    const analysis = {
      clean: true,
      suspicious: [],
      blacklisted: [],
      whitelisted: [],
    };

    for (const link of links) {
      const domain = link.hostname;

      // Check whitelist
      if (this.whitelist.has(domain)) {
        analysis.whitelisted.push(domain);
        continue;
      }

      // Check blacklist
      if (this.blacklist.has(domain)) {
        analysis.blacklisted.push(domain);
        analysis.clean = false;
        continue;
      }

      // Use brave-search to check domain reputation
      try {
        const reputation = await this.callMcp("brave-search", {
          query: `${domain} scam spam reputation`,
          count: 5,
        });

        // Simple heuristic: if many results mention spam/scam
        const suspiciousTerms = ["scam", "spam", "phishing", "malware"];
        const isSuspicious =
          reputation.data &&
          suspiciousTerms.some((term) =>
            JSON.stringify(reputation.data).toLowerCase().includes(term)
          );

        if (isSuspicious) {
          analysis.suspicious.push(domain);
          analysis.clean = false;
        }
      } catch (error) {
        this.log("WARN", `⚠️ Failed to check domain: ${domain}`);
      }
    }

    return analysis;
  }

  /**
   * Analyze user account
   */
  async analyzeAccount(username) {
    this.log("INFO", `👤 Analyzing account: ${username}`);

    // Placeholder for Reddit API account analysis
    // In production, this would fetch real account data
    const accountData = {
      username,
      accountAge: Math.random() * 365, // days
      karma: Math.floor(Math.random() * 10000),
      verified: Math.random() > 0.5,
      suspicious: false,
    };

    // Check suspicious patterns
    if (accountData.accountAge < this.config.thresholds.accountAgeMin) {
      accountData.suspicious = true;
      this.log("WARN", `⚠️ New account: ${username} (${accountData.accountAge} days)`);
    }

    if (accountData.karma < 10 && accountData.accountAge < 30) {
      accountData.suspicious = true;
      this.log("WARN", `⚠️ Low karma new account: ${username}`);
    }

    return accountData;
  }

  /**
   * Calculate overall spam score
   */
  calculateSpamScore(linkAnalysis, accountAnalysis) {
    let score = 0;

    // Blacklisted links = instant high score
    if (linkAnalysis.blacklisted.length > 0) {
      score += 0.8;
    }

    // Suspicious links
    score += linkAnalysis.suspicious.length * 0.2;

    // Account factors
    if (accountAnalysis.suspicious) {
      score += 0.3;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Generate human-readable reasons
   */
  generateReasons(linkAnalysis, accountAnalysis) {
    const reasons = [];

    if (linkAnalysis.blacklisted.length > 0) {
      reasons.push(`Blacklisted domains: ${linkAnalysis.blacklisted.join(", ")}`);
    }

    if (linkAnalysis.suspicious.length > 0) {
      reasons.push(`Suspicious domains: ${linkAnalysis.suspicious.join(", ")}`);
    }

    if (accountAnalysis.suspicious) {
      reasons.push(
        `Suspicious account: ${accountAnalysis.accountAge} days old, ${accountAnalysis.karma} karma`
      );
    }

    return reasons;
  }

  /**
   * Add domain to blacklist
   */
  addToBlacklist(domain) {
    this.blacklist.add(domain);
    this.log("INFO", `🔥 Added to blacklist: ${domain}`);
  }

  /**
   * Add domain to whitelist
   */
  addToWhitelist(domain) {
    this.whitelist.add(domain);
    this.log("INFO", `✅ Added to whitelist: ${domain}`);
  }

  /**
   * Detect coordinated activity across multiple posts
   */
  async detectCoordinatedActivity(contents) {
    this.log("INFO", `🕵️ Analyzing ${contents.length} items for coordination`);

    // Group by author
    const byAuthor = {};
    for (const content of contents) {
      if (!byAuthor[content.author]) {
        byAuthor[content.author] = [];
      }
      byAuthor[content.author].push(content);
    }

    // Find suspicious patterns
    const suspicious = [];
    for (const [author, items] of Object.entries(byAuthor)) {
      // Same links across multiple posts
      const allLinks = items.flatMap((item) => this.extractLinks(item.body || item.selftext));

      const linkCounts = {};
      allLinks.forEach((link) => {
        const url = link.href;
        linkCounts[url] = (linkCounts[url] || 0) + 1;
      });

      // If same link posted 3+ times by same user
      const repeatedLinks = Object.entries(linkCounts).filter(([_, count]) => count >= 3);

      if (repeatedLinks.length > 0) {
        suspicious.push({
          author,
          pattern: "repeated_links",
          links: repeatedLinks.map(([url, _]) => url),
        });
      }
    }

    if (suspicious.length > 0) {
      this.log("WARN", `⚠️ Coordinated activity detected: ${suspicious.length} users`);
    }

    return {
      detected: suspicious.length > 0,
      patterns: suspicious,
    };
  }
}

module.exports = SpamDetector;
