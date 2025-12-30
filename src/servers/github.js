/**
 * BambiSleep™ Church MCP Control Tower
 * GitHub MCP Server Wrapper - Repository Operations
 */

import { createLogger } from '../utils/logger.js';

const logger = createLogger('github');

const GITHUB_API = 'https://api.github.com';

/**
 * GitHub API client
 */
class GitHubClient {
  constructor(token = process.env.GITHUB_TOKEN) {
    this.token = token;
    this.headers = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'BambiSleep-MCP-Control-Tower',
    };
    if (token) {
      this.headers.Authorization = `Bearer ${token}`;
    }
  }

  /**
   * Make GitHub API request
   */
  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${GITHUB_API}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: { ...this.headers, ...options.headers },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `GitHub API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get authenticated user
   */
  async getUser() {
    return this.request('/user');
  }

  /**
   * List user repositories
   */
  async listRepos(options = {}) {
    const params = new URLSearchParams({
      per_page: options.perPage || 30,
      page: options.page || 1,
      sort: options.sort || 'updated',
    });
    return this.request(`/user/repos?${params}`);
  }

  /**
   * Get repository details
   */
  async getRepo(owner, repo) {
    return this.request(`/repos/${owner}/${repo}`);
  }

  /**
   * List repository branches
   */
  async listBranches(owner, repo) {
    return this.request(`/repos/${owner}/${repo}/branches`);
  }

  /**
   * Get file contents
   */
  async getContent(owner, repo, path, ref = 'main') {
    return this.request(`/repos/${owner}/${repo}/contents/${path}?ref=${ref}`);
  }

  /**
   * Create or update file
   */
  async createOrUpdateFile(owner, repo, path, content, message, sha = null) {
    const body = {
      message,
      content: Buffer.from(content).toString('base64'),
    };
    if (sha) body.sha = sha;

    return this.request(`/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /**
   * List issues
   */
  async listIssues(owner, repo, options = {}) {
    const params = new URLSearchParams({
      state: options.state || 'open',
      per_page: options.perPage || 30,
    });
    return this.request(`/repos/${owner}/${repo}/issues?${params}`);
  }

  /**
   * Create issue
   */
  async createIssue(owner, repo, title, body, labels = []) {
    return this.request(`/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      body: JSON.stringify({ title, body, labels }),
    });
  }

  /**
   * List pull requests
   */
  async listPullRequests(owner, repo, options = {}) {
    const params = new URLSearchParams({
      state: options.state || 'open',
      per_page: options.perPage || 30,
    });
    return this.request(`/repos/${owner}/${repo}/pulls?${params}`);
  }

  /**
   * Create pull request
   */
  async createPullRequest(owner, repo, title, body, head, base = 'main') {
    return this.request(`/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      body: JSON.stringify({ title, body, head, base }),
    });
  }

  /**
   * Fork repository
   */
  async forkRepo(owner, repo, organization = null) {
    const body = organization ? { organization } : {};
    return this.request(`/repos/${owner}/${repo}/forks`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Search repositories
   */
  async searchRepos(query, options = {}) {
    const params = new URLSearchParams({
      q: query,
      per_page: options.perPage || 30,
      page: options.page || 1,
    });
    return this.request(`/search/repositories?${params}`);
  }

  /**
   * Search code
   */
  async searchCode(query, options = {}) {
    const params = new URLSearchParams({
      q: query,
      per_page: options.perPage || 30,
    });
    return this.request(`/search/code?${params}`);
  }
}

// Singleton instance
export const githubClient = new GitHubClient();

/**
 * GitHub API handlers for REST endpoints
 */
export const githubHandlers = {
  // GET /api/github/user - Get authenticated user
  getUser: () => githubClient.getUser(),

  // GET /api/github/repos - List repositories
  listRepos: (options) => githubClient.listRepos(options),

  // GET /api/github/repos/:owner/:repo - Get repository
  getRepo: (owner, repo) => githubClient.getRepo(owner, repo),

  // GET /api/github/repos/:owner/:repo/branches - List branches
  listBranches: (owner, repo) => githubClient.listBranches(owner, repo),

  // GET /api/github/repos/:owner/:repo/contents/:path - Get file
  getContent: (owner, repo, path, ref) =>
    githubClient.getContent(owner, repo, path, ref),

  // PUT /api/github/repos/:owner/:repo/contents/:path - Create/update file
  createOrUpdateFile: (owner, repo, path, content, message, sha) =>
    githubClient.createOrUpdateFile(owner, repo, path, content, message, sha),

  // GET /api/github/repos/:owner/:repo/issues - List issues
  listIssues: (owner, repo, options) =>
    githubClient.listIssues(owner, repo, options),

  // POST /api/github/repos/:owner/:repo/issues - Create issue
  createIssue: (owner, repo, title, body, labels) =>
    githubClient.createIssue(owner, repo, title, body, labels),

  // GET /api/github/repos/:owner/:repo/pulls - List PRs
  listPullRequests: (owner, repo, options) =>
    githubClient.listPullRequests(owner, repo, options),

  // POST /api/github/repos/:owner/:repo/pulls - Create PR
  createPullRequest: (owner, repo, title, body, head, base) =>
    githubClient.createPullRequest(owner, repo, title, body, head, base),

  // POST /api/github/repos/:owner/:repo/forks - Fork repository
  forkRepo: (owner, repo, organization) =>
    githubClient.forkRepo(owner, repo, organization),

  // GET /api/github/search/repos - Search repositories
  searchRepos: (query, options) => githubClient.searchRepos(query, options),

  // GET /api/github/search/code - Search code
  searchCode: (query, options) => githubClient.searchCode(query, options),
};

export default githubHandlers;
