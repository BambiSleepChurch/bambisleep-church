# 🤖 HarleyVader - Universal Machine Documentation Hub

> _"Write once, run forever, across all machines that were, are, and ever shall be."_

**Production-ready documentation platform** built with **Express + React** - Browse, search, and render markdown documentation with beautiful syntax highlighting and full-text search.

---

## 🚀 Quick Start (30 seconds)

```bash
# 1. Install dependencies
npm install

# 2. Start development servers (Express API + Vite)
npm run dev

# 3. Open browser
# Frontend: http://localhost:5173
# API: http://localhost:3000/api/docs/tree
```

**That's it!** The app will automatically:
- Load all markdown files from `docs/` folder
- Build sidebar navigation tree
- Enable full-text search across all docs
- Render markdown with syntax highlighting

---

## ✨ Features

🔍 **Full-Text Search** - Find anything across all documentation  
📚 **Auto-Navigation** - Sidebar generated from folder structure  
🎨 **Syntax Highlighting** - Code blocks with highlight.js  
📱 **Responsive Design** - Works on desktop, tablet, mobile  
⚡ **Fast** - Vite HMR for instant updates  
🌙 **Dark Theme** - Diablo-inspired aesthetic with pink/purple accents  
🔗 **Auto-Linked Headings** - Click headings to get direct links  
📝 **GFM Support** - Tables, task lists, strikethrough, footnotes

---

## 📦 What's Inside

### Backend (Express REST API)
- `server.js` (208 lines) - Express server with 3 API endpoints
- Serves documentation tree, file content, and search
- Security: Helmet, CORS, directory traversal prevention
- Compression: Gzip for static assets

### Frontend (React SPA)
- `src/App.jsx` - Main app with routing
- `src/components/Sidebar.jsx` - Collapsible navigation tree
- `src/components/DocumentViewer.jsx` - Markdown renderer
- `src/components/SearchBar.jsx` - Full-text search
- `src/pages/Home.jsx` - Landing page

### Documentation
- **62 markdown files** organized in `docs/projects/`
- **BambiSleep Church** (30 docs) - Express.js web app with Stripe, WebSocket, FFmpeg
- **Catgirl Control Tower** (30 docs) - MCP orchestration system with 8 servers
- **Navigation indexes** - COMPLETE_INDEX.md, per-project INDEX.md files

---

## 📚 Documentation Structure

```
docs/
└── projects/
    ├── COMPLETE_INDEX.md           # Ecosystem-wide navigation
    ├── MIGRATION_REPORT.md         # Documentation migration details
    ├── bambisleep-church/          # 30 files - Express.js web app
    │   ├── INDEX.md                # Project navigation
    │   ├── BUILD.md                # 408-line development roadmap
    │   ├── architecture/           # System design
    │   ├── development/            # Dev setup guides
    │   ├── integration/            # MCP servers
    │   ├── operations/             # Monitoring (OpenTelemetry)
    │   └── docs/                   # Additional guides
    └── catgirl-control-tower/      # 30 files - MCP orchestration
        ├── INDEX.md                # Project navigation
        ├── BUILD.md                # 408-line development roadmap
        ├── MCP_SETUP_GUIDE.md      # Server configuration
        └── .github/docs/           # Deep documentation
            └── codebase/           # API, architecture, guides
```

---

## 🏗️ Architecture

### How It Works

```
┌─────────────────┐
│ Browser Client  │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐      ┌──────────────┐
│  Vite Dev (5173)│─────▶│  Express API │
│  React SPA      │ Proxy│  (3000)      │
└─────────────────┘      └──────┬───────┘
                                 │
                                 ▼
                         ┌──────────────┐
                         │ docs/*.md    │
                         │ Markdown     │
                         └──────────────┘
```

1. **Express API** reads markdown files from `docs/` folder
2. **React frontend** fetches via `/api/docs/tree` and `/api/docs/content`
3. **react-markdown** renders with GFM, syntax highlighting, auto-linked headings
4. **Vite** provides fast HMR in dev, optimized bundle for production

### Why React (not EJS)?

✅ **SPA** - No page reloads, instant navigation  
✅ **Component reusability** - Sidebar, search, viewer are isolated  
✅ **Modern tooling** - Vite HMR (instant updates), React DevTools  
✅ **API-first** - Backend is pure JSON REST API  
✅ **Better UX** - Smooth transitions, client-side routing

---

## 🎯 API Endpoints

```bash
GET /api/docs/tree              # Get documentation structure (tree)
GET /api/docs/content?path=...  # Get markdown file content
GET /api/docs/search?q=...      # Full-text search with context
GET /health                     # Health check
```

**Example API Usage**:

```javascript
// Fetch documentation tree
const tree = await fetch('/api/docs/tree').then(r => r.json());

// Get specific file
const doc = await fetch('/api/docs/content?path=projects/bambisleep-church/BUILD.md')
  .then(r => r.json());

// Search
const results = await fetch('/api/docs/search?q=express')
  .then(r => r.json());
```

---

## 🛠️ Development

### Adding New Documentation

1. **Create markdown file** anywhere in `docs/` folder
2. **It automatically appears** in sidebar navigation
3. **Search indexes it** automatically

```bash
# Example: Add new documentation
echo "# My New Guide" > docs/projects/my-project/guide.md
# Refresh browser - it's already there!
```

### Project Structure

```
HarleyVader/
├── server.js              # Express API (208 lines)
├── vite.config.js         # Vite configuration
├── package.json           # Dependencies
├── index.html             # Vite entry point
├── docs/                  # Documentation (62 markdown files)
│   └── projects/          # Project documentation
├── src/                   # React application
│   ├── App.jsx            # Main app
│   ├── components/        # Sidebar, DocumentViewer, SearchBar
│   └── pages/             # Home page
└── public/                # Static assets
    └── css/               # Stylesheets
```

### Scripts

```bash
npm run dev        # Start Express (3000) + Vite (5173)
npm run build      # Build for production (creates dist/)
npm start          # Run production server (serves dist/)
npm run lint       # ESLint on src/**/*.{js,jsx}
npm run format     # Prettier formatting
```

---

## 🚀 Production Deployment

```bash
# 1. Build React app
npm run build

# 2. Start Express server (serves dist/ + API)
npm start

# Server runs on http://localhost:3000
```

**Production behavior**:
- Express serves built React app from `dist/` folder
- Markdown files remain in `docs/` (read by API)
- All routes serve `index.html` (SPA fallback)
- API endpoints respond with JSON

**Environment Variables**:
```bash
PORT=3000          # Server port (default: 3000)
NODE_ENV=production
```

---

## 📦 Tech Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Backend** | Express 4.19 | Web framework |
| | Helmet 7.1 | Security headers |
| | CORS | Cross-origin requests |
| | Compression | Gzip compression |
| **Frontend** | React 18.3 | UI library |
| | React Router 6.26 | Client-side routing |
| | react-markdown 9.0 | Markdown → React |
| | remark-gfm 4.0 | GitHub Flavored Markdown |
| | rehype-highlight 7.0 | Syntax highlighting |
| | rehype-slug 6.0 | Heading IDs |
| | rehype-autolink-headings 7.1 | Clickable headings |
| **Build** | Vite 5.4 | Fast dev server + bundler |
| | @vitejs/plugin-react | React support |
| **Dev Tools** | nodemon | Auto-restart Express |
| | concurrently | Run multiple commands |
| | ESLint | Linting |
| | Prettier | Code formatting |

---

## 🤖 Universal Machine Philosophy

This project embodies the **Universal Machine** philosophy:

> _"Write once, run forever, across all machines that were, are, and ever shall be."_

**How we achieve this**:
- 📝 **Markdown** - Plain text format that renders everywhere
- ⚛️ **React** - Write once, run in any modern browser
- 🔌 **REST API** - Standard HTTP/JSON consumable by any client
- 🐳 **Docker-ready** - Containerized deployment anywhere
- 🌐 **Static generation** - Can be exported as static HTML

Read the full manifesto: **[Universal-Machine.md](Universal-Machine.md)**

---

## 👁️‍🗨️ About HarleyVader

**Location**: Fuckersberg, Austria 🇦🇹  
**Passions**: Creative software, AI, digital storytelling, mental wellness  
**Philosophy**: Building immersive, interactive experiences that combine technology with artistry

### 🔗 Projects

- 🌸 **BambiSleep.Church** - https://bambisleep.church
- 💬 **BambiSleep.Chat** - https://bambisleep.chat
- 💎 **Patreon** - https://patreon.com/BambiSleepChat
- 🐦 **Twitter** - [@BambiSleep_Chat](https://twitter.com/BambiSleep_Chat)
- 📘 **Facebook** - [BambiSleepChat](https://facebook.com/BambiSleep.Chat)

---

## 📖 Developer Documentation

**For comprehensive AI agent instructions and development guidelines:**

👉 **[.github/copilot-instructions.md](.github/copilot-instructions.md)** (170 lines)

Includes:
- Quick commands reference
- Architecture overview
- Key development patterns
- AI agent guidelines
- Troubleshooting guide

---

## 📜 License

MIT License - Free to use, modify, and distribute with attribution.

---

**Last Updated**: November 3, 2025  
**Version**: 2.0 (Documentation Migration Complete - 62 markdown files)  
**Status**: ✅ Production Ready

Thank you for visiting! 💜
