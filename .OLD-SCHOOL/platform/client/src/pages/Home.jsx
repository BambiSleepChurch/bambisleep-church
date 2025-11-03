import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home-page">
      <section className="hero">
        <h1 className="hero-title">🤖 Universal Machine Philosophy</h1>
        <p className="hero-subtitle">
          "Write once, run forever, across all machines that were, are, and ever shall be."
        </p>
        <p className="hero-description">
          Welcome to the documentation hub for the BambiSleep ecosystem and Universal Machine philosophy.
        </p>
      </section>

      <section className="features">
        <div className="feature-card">
          <span className="feature-icon">📚</span>
          <h2>Documentation Hub</h2>
          <p>
            Comprehensive guides, architecture docs, and development workflows for all BambiSleep projects.
          </p>
        </div>

        <div className="feature-card">
          <span className="feature-icon">🎨</span>
          <h2>Universal Compatibility</h2>
          <p>
            Explore the philosophy of building systems that transcend hardware boundaries and run everywhere.
          </p>
        </div>

        <div className="feature-card">
          <span className="feature-icon">🤖</span>
          <h2>AI-Powered Ecosystem</h2>
          <p>
            MCP servers, AI agents, and hypnotic experiences powered by modern web technologies.
          </p>
        </div>
      </section>

      <section className="projects">
        <h2>📦 Project Documentation</h2>
        <div className="project-grid">
          <Link to="/docs/projects/bambisleep-church/README.md" className="project-card">
            <h3>🌸 BambiSleep Church</h3>
            <p>Express.js MCP Control Tower with Stripe integration, WebSockets, and OpenTelemetry monitoring</p>
            <span className="project-link">View Documentation →</span>
          </Link>

          <Link to="/docs/projects/bambisleep-church/architecture/architecture.md" className="project-card">
            <h3>🏗️ Architecture Guide</h3>
            <p>8-layer dependency lattice, security patterns, and system design principles</p>
            <span className="project-link">View Architecture →</span>
          </Link>

          <Link to="/docs/projects/bambisleep-church/philosophy/philosophy.md" className="project-card">
            <h3>🧬 Philosophy & Intent</h3>
            <p>The Six Genesis Questions and sacred invariants behind the system</p>
            <span className="project-link">View Philosophy →</span>
          </Link>

          <Link to="/docs/projects/bambisleep-church/reference/QUICK_REFERENCE.md" className="project-card">
            <h3>🎯 Quick Reference</h3>
            <p>Essential commands, testing, deployment, and troubleshooting guides</p>
            <span className="project-link">View Reference →</span>
          </Link>
        </div>
      </section>

      <section className="about">
        <h2>👁️‍🗨️ About</h2>
        <p>
          HarleyVader is a creative technologist exploring AI, hypnotic experiences, and universal computing.
          Based in Fuckersberg, Austria 🇦🇹
        </p>
        <div className="social-links">
          <a href="https://bambisleep.church" target="_blank" rel="noopener noreferrer">
            🌸 BambiSleep.Church
          </a>
          <a href="https://bambisleep.chat" target="_blank" rel="noopener noreferrer">
            💬 BambiSleep.Chat
          </a>
          <a href="https://patreon.com/BambiSleepChat" target="_blank" rel="noopener noreferrer">
            💎 Patreon
          </a>
          <a href="https://twitter.com/BambiSleep_Chat" target="_blank" rel="noopener noreferrer">
            🐦 Twitter
          </a>
        </div>
      </section>

      <footer className="home-footer">
        <p>
          Built with Express + React + react-markdown | No EJS, pure React SPA
        </p>
        <p>
          💜 Powered by the Universal Machine Philosophy
        </p>
      </footer>
    </div>
  );
}

export default Home;
