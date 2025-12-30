/**
 * BambiSleep™ Church MCP Control Tower
 * Puppeteer MCP Server Wrapper - Browser Automation
 */

import { createLogger } from '../utils/logger.js';

const logger = createLogger('puppeteer');

/**
 * Browser automation client
 * Requires puppeteer to be installed for full functionality
 */
class PuppeteerClient {
  constructor() {
    this.browser = null;
    this.page = null;
    this.screenshots = new Map();
    this.consoleLogs = [];
  }

  /**
   * Check if puppeteer is available
   */
  async checkAvailable() {
    try {
      await import('puppeteer');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Launch browser
   */
  async launch(options = {}) {
    const puppeteer = await import('puppeteer');
    
    this.browser = await puppeteer.default.launch({
      headless: options.headless !== false,
      args: options.args || ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    this.page = await this.browser.newPage();
    
    // Capture console logs
    this.page.on('console', (msg) => {
      this.consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString(),
      });
    });

    logger.info('Browser launched');
    return { success: true, message: 'Browser launched' };
  }

  /**
   * Navigate to URL
   */
  async navigate(url, options = {}) {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }

    await this.page.goto(url, {
      waitUntil: options.waitUntil || 'networkidle0',
      timeout: options.timeout || 30000,
    });

    const title = await this.page.title();
    logger.info(`Navigated to: ${url}`);
    return { success: true, url, title };
  }

  /**
   * Take screenshot
   */
  async screenshot(options = {}) {
    if (!this.page) {
      throw new Error('Browser not launched');
    }

    const buffer = await this.page.screenshot({
      fullPage: options.fullPage || false,
      type: options.type || 'png',
    });

    const id = `screenshot_${Date.now()}`;
    const base64 = buffer.toString('base64');
    this.screenshots.set(id, base64);

    logger.info(`Screenshot captured: ${id}`);
    return { success: true, id, base64 };
  }

  /**
   * Click element
   */
  async click(selector, options = {}) {
    if (!this.page) throw new Error('Browser not launched');

    await this.page.waitForSelector(selector, { timeout: options.timeout || 5000 });
    await this.page.click(selector);

    logger.debug(`Clicked: ${selector}`);
    return { success: true, selector };
  }

  /**
   * Type text
   */
  async type(selector, text, options = {}) {
    if (!this.page) throw new Error('Browser not launched');

    await this.page.waitForSelector(selector, { timeout: options.timeout || 5000 });
    await this.page.type(selector, text, { delay: options.delay || 0 });

    logger.debug(`Typed into: ${selector}`);
    return { success: true, selector };
  }

  /**
   * Get page content
   */
  async getContent() {
    if (!this.page) throw new Error('Browser not launched');
    return await this.page.content();
  }

  /**
   * Get text content of element
   */
  async getText(selector) {
    if (!this.page) throw new Error('Browser not launched');

    await this.page.waitForSelector(selector);
    const text = await this.page.$eval(selector, (el) => el.textContent);
    return text.trim();
  }

  /**
   * Get attribute of element
   */
  async getAttribute(selector, attribute) {
    if (!this.page) throw new Error('Browser not launched');

    await this.page.waitForSelector(selector);
    return await this.page.$eval(selector, (el, attr) => el.getAttribute(attr), attribute);
  }

  /**
   * Evaluate JavaScript
   */
  async evaluate(script) {
    if (!this.page) throw new Error('Browser not launched');
    return await this.page.evaluate(script);
  }

  /**
   * Wait for selector
   */
  async waitForSelector(selector, options = {}) {
    if (!this.page) throw new Error('Browser not launched');
    await this.page.waitForSelector(selector, { timeout: options.timeout || 5000 });
    return { success: true, selector };
  }

  /**
   * Wait for navigation
   */
  async waitForNavigation(options = {}) {
    if (!this.page) throw new Error('Browser not launched');
    await this.page.waitForNavigation({ waitUntil: options.waitUntil || 'networkidle0' });
    return { success: true };
  }

  /**
   * Set viewport
   */
  async setViewport(width, height) {
    if (!this.page) throw new Error('Browser not launched');
    await this.page.setViewport({ width, height });
    return { success: true, width, height };
  }

  /**
   * Get cookies
   */
  async getCookies() {
    if (!this.page) throw new Error('Browser not launched');
    return await this.page.cookies();
  }

  /**
   * Set cookies
   */
  async setCookies(cookies) {
    if (!this.page) throw new Error('Browser not launched');
    await this.page.setCookie(...cookies);
    return { success: true };
  }

  /**
   * Clear cookies
   */
  async clearCookies() {
    if (!this.page) throw new Error('Browser not launched');
    const client = await this.page.target().createCDPSession();
    await client.send('Network.clearBrowserCookies');
    return { success: true };
  }

  /**
   * PDF generation
   */
  async pdf(options = {}) {
    if (!this.page) throw new Error('Browser not launched');

    const buffer = await this.page.pdf({
      format: options.format || 'A4',
      printBackground: options.printBackground !== false,
    });

    return {
      success: true,
      base64: buffer.toString('base64'),
    };
  }

  /**
   * Get console logs
   */
  getConsoleLogs() {
    return this.consoleLogs;
  }

  /**
   * Clear console logs
   */
  clearConsoleLogs() {
    this.consoleLogs = [];
    return { success: true };
  }

  /**
   * Close browser
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      logger.info('Browser closed');
    }
    return { success: true };
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      browserLaunched: !!this.browser,
      hasPage: !!this.page,
      screenshotCount: this.screenshots.size,
      consoleLogCount: this.consoleLogs.length,
    };
  }
}

// Singleton instance
export const puppeteerClient = new PuppeteerClient();

/**
 * Puppeteer API handlers for REST endpoints
 */
export const puppeteerHandlers = {
  // Browser lifecycle
  checkAvailable: () => puppeteerClient.checkAvailable(),
  launch: (options) => puppeteerClient.launch(options),
  close: () => puppeteerClient.close(),
  getStatus: () => puppeteerClient.getStatus(),

  // Navigation
  navigate: (url, options) => puppeteerClient.navigate(url, options),
  waitForNavigation: (options) => puppeteerClient.waitForNavigation(options),

  // Content
  getContent: () => puppeteerClient.getContent(),
  getText: (selector) => puppeteerClient.getText(selector),
  getAttribute: (selector, attribute) => puppeteerClient.getAttribute(selector, attribute),

  // Interaction
  click: (selector, options) => puppeteerClient.click(selector, options),
  type: (selector, text, options) => puppeteerClient.type(selector, text, options),
  waitForSelector: (selector, options) => puppeteerClient.waitForSelector(selector, options),

  // Screenshots & PDF
  screenshot: (options) => puppeteerClient.screenshot(options),
  pdf: (options) => puppeteerClient.pdf(options),

  // Viewport
  setViewport: (width, height) => puppeteerClient.setViewport(width, height),

  // Cookies
  getCookies: () => puppeteerClient.getCookies(),
  setCookies: (cookies) => puppeteerClient.setCookies(cookies),
  clearCookies: () => puppeteerClient.clearCookies(),

  // JavaScript
  evaluate: (script) => puppeteerClient.evaluate(script),

  // Console
  getConsoleLogs: () => puppeteerClient.getConsoleLogs(),
  clearConsoleLogs: () => puppeteerClient.clearConsoleLogs(),
};

export default puppeteerHandlers;
