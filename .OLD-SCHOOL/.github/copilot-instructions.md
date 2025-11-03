# GitHub Copilot Instructions — .OLD-SCHOOL Workspace

Purpose: Guide AI coding agents in this consolidated, unified workspace.

## 🎯 Workspace Structure (CONSOLIDATED)

```
/mnt/f/.OLD-SCHOOL/
├── docs/                    # ALL documentation & content
│   ├── philosophy/          # Universal Machine philosophy
│   ├── projects/            # External project docs
│   └── languages/codecraft/ # CodeCraft specification
├── platform/                # Documentation platform (Express + React)
│   ├── server/              # Express REST API
│   └── client/              # React SPA (Vite)
├── languages/codecraft/     # CodeCraft language implementations
│   └── spec/                # Specification (symlinked to docs/)
├── scripts/                 # Build & utility scripts
└── .github/                 # Workspace instructions
```

**Migration Note**: Consolidated from `HarleyVader/` + `KRYSSIE/` (archived in `.OLD/`)

## ⚡ Quick Start

**Platform (Documentation Hub)**:

```bash
cd platform/server
npm install
npm run dev    # Starts Express API (3000) + Vite (5173) concurrently
```

**Browse Specifications**:

```bash
# CodeCraft language spec (5502 lines)
less docs/languages/codecraft/CODECRAFT_ROSETTA_STONE.md
```

## 📖 Big Picture

**Platform**: Express + React documentation platform

- `platform/server/server.js` — Pure JSON API (NO server-side templates)
- `platform/client/src/` — React components with react-markdown pipeline
- `docs/` — ALL markdown content (auto-indexed and searchable)

**CodeCraft Language**: Custom programming language specification

- `docs/languages/codecraft/CODECRAFT_ROSETTA_STONE.md` — 5502-line canonical reference
- `languages/codecraft/spec/` — Symlinked specification for code examples
- `languages/codecraft/examples/` — TypeScript & C# implementations

## 🏗️ Technical Architecture

**Platform data flow**:

```
Browser → Vite (dev) → Express API → Filesystem
   │         │              │             │
   │         │              │             └─ docs/*.md (content)
   │         │              └─ /api/docs/tree (structure)
   │         │                 /api/docs/content (files)
   │         │                 /api/docs/search (search)
   │         └─ Proxy /api/* → localhost:3000
   └─ React components render markdown
```

**Key technical decisions**:

1. **Dual-server development**: Express (3000) + Vite (5173) run concurrently via `npm run dev`

   - Vite proxies API requests to Express
   - Enables HMR for React without restarting backend
   - `nodemon` watches server.js for backend changes

2. **API-driven content**: Markdown files served via REST API, not bundled

   - `GET /api/docs/tree` — Recursive directory scan builds navigation tree
   - `GET /api/docs/content?path=X` — Reads file with directory traversal protection
   - `GET /api/docs/search?q=X` — Full-text search with context snippets (5 matches/file)

3. **React markdown pipeline**:

   - `react-markdown` — Core renderer
   - `remark-gfm` — GitHub Flavored Markdown (tables, task lists, strikethrough)
   - `remark-breaks` — Line breaks without double space
   - `rehype-highlight` — Syntax highlighting via highlight.js
   - `rehype-slug` — Auto-generate heading IDs
   - `rehype-autolink-headings` — Clickable heading anchors

4. **Security layers**:

   - `helmet` — Sets security headers (CSP disabled for React dev)
   - `cors` — CORS enabled for development
   - Path normalization prevents `../` directory traversal
   - All file reads validated against `docs/` base path

5. **Production serving**:
   - Express checks for `dist/` (production build) or `public/` (dev fallback)
   - SPA routing: all non-API routes serve `index.html`
   - `compression` middleware for gzip
   - `sourcemap: true` for debugging production issues

## 🔑 Critical Patterns

### Platform (Documentation Hub)

**Dual-server architecture**:

- Express (port 3000) serves JSON API + static files
- Vite (port 5173) dev server proxies `/api/*` to Express
- `npm run dev` from `platform/server/` runs both via concurrently

**API-driven documentation**:

```javascript
GET /api/docs/tree              // Recursive doc structure
GET /api/docs/content?path=...  // Markdown file content
GET /api/docs/search?q=...      // Full-text search
```

**Adding docs is zero-config**:

```bash
echo "# My Doc" > docs/my-doc.md  # Instantly indexed & searchable
```

**Content voice**: Visionary/poetic with emoji headers (see `docs/philosophy/Universal-Machine.md`)

### CodeCraft Language

**Token≠Schools Invariant (SACRED)**:

- 21 grammar tokens map to 19 Arcane Schools
- This oddity is intentional — it's the language's identity anchor

**Dual-channel commentomancy**:

```python
/// LAW: Technical invariant (formal documentation)
//<3 LORE: Intentional context (emotional meaning)
```

**Ritual syntax pattern**:

```python
# ::school:ritual(params) -> result
request_id = str(uuid.uuid4())
```

**8-layer dependency architecture**:

- Layer 0: Cantrips, Divination (required by 100% of schools)
- Layer 7: Apotheosis (collective intelligence)

## 🚨 Agent Rules

### ❌ DON'T

1. Add EJS/Pug templates to platform — it's a REST API + React SPA
2. Bundle markdown into React build — markdown stays in `docs/`, served via API
3. Modify CodeCraft canonical files without understanding governance model
4. Change philosophical tone in docs — preserve emoji + metaphorical style
5. Assume `HarleyVader/` or `KRYSSIE/` exist — workspace is consolidated

### ✅ DO

1. Use `platform/` for app code, `docs/` for content, `languages/` for specs
2. Use client-side routing (React Router) for all pages
3. Preserve dual-memory (Law/Lore) comments in CodeCraft examples
4. Run `npm run dev` from `platform/server/` to test changes
5. Treat documentation as data, not code artifacts

## 📁 Key Files

**Platform**:

- `platform/server/server.js` (215 lines) — Express API with security & search
  - `buildDocTree()` — Recursive filesystem scan for sidebar navigation
  - `searchDocs()` — Full-text search with context extraction
  - `extractMatches()` — Returns up to 5 matches per file with surrounding lines
- `platform/client/src/App.jsx` — React router + doc tree state
- `platform/client/src/components/DocumentViewer.jsx` — react-markdown renderer
  - Uses 6 remark/rehype plugins for GFM, syntax highlighting, auto-linking
  - Fetches content via `/api/docs/content?path=X`
- `platform/client/vite.config.js` — Dev server with API proxy
  - Port 5173, proxies `/api/*` to Express on 3000
  - Build output: `dist/` with source maps
- `platform/server/package.json` — Dependencies & scripts
  - `npm run dev` — concurrently runs Express + Vite
  - `npm run build` — Vite production build
  - `npm run lint` — ESLint, `npm run format` — Prettier
- `platform/.env.example` — Environment configuration template (PORT, NODE_ENV)

**Documentation**:

- `docs/philosophy/Universal-Machine.md` — Core philosophy manifesto
- `docs/projects/` — External project docs (BambiSleep Church, Catgirl Control Tower)
  - 62 markdown files total
  - Each project has INDEX.md, BUILD.md, architecture/, docs/
- `docs/languages/codecraft/CODECRAFT_ROSETTA_STONE.md` — CodeCraft specification (5502 lines)

**Languages**:

- `languages/codecraft/spec/CODECRAFT_ROSETTA_STONE.md` — Symlink to `docs/languages/codecraft/`
  - Created via: `ln -s ../../../docs/languages/codecraft/CODECRAFT_ROSETTA_STONE.md`
- `languages/codecraft/examples/` — TypeScript & C# implementation examples
  - `typescript-example/` has tests (npm test)
  - `csharp-example/` has .sln + multiple projects

**Build/Scripts**:

- `scripts/` — Currently empty (no build utilities yet)
- Future: Validators, doc generators, deployment scripts

## 🔄 Development Workflows

**Platform frontend change**:

```bash
cd platform/server
npm run dev          # Start dual servers (Express + Vite)
# Edit platform/client/src/components/*.jsx
# Browser auto-reloads via Vite HMR
```

**Add documentation**:

```bash
# Just create markdown file — no build step needed
echo "# New Doc" > docs/new-doc.md
# Refresh browser — appears in sidebar automatically
```

**Update language spec**:

```bash
# Edit the canonical source
vi docs/languages/codecraft/CODECRAFT_ROSETTA_STONE.md
# Symlink in languages/codecraft/spec/ automatically reflects changes
```

**Code quality checks**:

```bash
cd platform/server
npm run lint         # ESLint on src/**/*.{js,jsx}
npm run format       # Prettier auto-formatting
```

## 🚀 Build & Deployment

**Production build**:

```bash
cd platform/server
npm run build        # Vite builds React app → dist/
npm start            # Express serves dist/ + API on port 3000
```

**Build output**:

- `platform/server/dist/` — Compiled React SPA (optimized, minified)
- `platform/server/dist/index.html` — Entry point with asset links
- Source maps enabled (`sourcemap: true` in vite.config.js)

**Deployment architecture**:

```
┌─────────────────────────────────────┐
│ Express Server (PORT 3000)          │
│ ├─ Serve static files from dist/   │
│ ├─ API routes /api/docs/*           │
│ └─ SPA fallback (all routes → index)│
└─────────────────────────────────────┘
         │
         ├─ dist/              (React build)
         └─ docs/              (Markdown content)
```

**Environment variables** (`.env` or hosting platform):

```bash
PORT=3000                    # Server port (default: 3000)
NODE_ENV=production          # Disables dev logging
DOCS_PATH=./docs             # Optional: custom docs location
```

**Static hosting alternative**:

```bash
npm run build                # Build React SPA
npm run preview              # Preview build locally (Vite preview server)
# Deploy dist/ to Netlify/Vercel/GitHub Pages
# Note: API endpoints won't work without Express backend
```

## 🧪 Testing

**Current state**: No automated tests configured for platform

**CodeCraft examples** have test structure:

```bash
cd languages/codecraft/examples/typescript-example
npm test                     # Runs tests/main.test.ts
```

**Testing philosophy**: Platform relies on manual testing + real-world usage validation

- React components tested via browser inspection
- API endpoints verified via manual curl/browser testing
- Markdown rendering validated with diverse doc samples

**Future testing setup** (not implemented):

- Jest/Vitest for unit tests
- React Testing Library for components
- Supertest for API endpoints

## 🎨 Content Philosophy

**Platform**: "Universal Machine" voice

- Emoji section headers: `## 🤖 Architecture`
- Visionary language connecting tech to consciousness
- Long-form narrative style (not terse docs)
- See `docs/philosophy/Universal-Machine.md` for tone reference

**CodeCraft**: Dual-memory architecture

- Law (`///`) and Lore (`//<3`) are equally first-class
- Documentation IS the language's substrate (not "about" the language)
- Ritual syntax makes intent explicit

## ⚠️ Common Misconceptions

1. **Platform is NOT an SSR app** — No EJS, no template rendering
2. **Validators are referenced but not present** — `validate_schools.py` not in workspace
3. **Projects in docs/ are external** — Unity systems, MCP servers documented but not in workspace
4. **Old structure is gone** — `HarleyVader/` and `KRYSSIE/` archived in `.OLD/`
5. **Single source of truth** — `docs/` is the canonical location for all content

---

**Last Updated**: 2025-11-03  
**Workspace Path**: `/mnt/f/.OLD-SCHOOL/`  
**Architecture**: Consolidated (docs + platform + languages)

If anything is unclear, ask for specific examples, commands, or file locations and I'll iterate.
