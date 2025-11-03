# .OLD-SCHOOL — Consolidated Workspace

**Consolidated architecture**: Documentation platform + language specifications in unified structure.

## 🎯 Directory Structure

```
.OLD-SCHOOL/
├── docs/                    # ALL documentation & content
│   ├── philosophy/          # Universal Machine philosophy
│   ├── projects/            # External project documentation  
│   └── languages/           # Language specifications
│       └── codecraft/       # CodeCraft language spec
├── platform/                # HarleyVader documentation platform
│   ├── server/              # Express REST API
│   ├── client/              # React SPA (Vite)
│   └── README.md            # Platform setup guide
├── languages/               # Language implementations & examples
│   └── codecraft/
│       └── spec/            # CodeCraft specification (symlinked)
├── scripts/                 # Build & utility scripts
└── .github/                 # Workspace AI instructions
```

## ⚡ Quick Start

**Run the documentation platform**:
```bash
cd platform/server
npm install
npm run dev    # Express (3000) + Vite (5173)
```

**Browse language specs**:
```bash
less docs/languages/codecraft/CODECRAFT_ROSETTA_STONE.md
```

## 📖 What's Inside

### Platform (HarleyVader)
Express + React documentation platform with:
- REST API serving markdown from `docs/`
- React SPA with search & navigation
- Zero-config: just add `.md` files to `docs/`

### Documentation
- **Philosophy**: Universal Machine vision
- **Projects**: External project docs (BambiSleep Church, Catgirl Control Tower)  
- **Languages**: CodeCraft specification (5503 lines)

### Languages
- **CodeCraft**: Custom language with 19 Arcane Schools, dual-memory architecture

## 🔄 Migration Note

This workspace was consolidated from:
- `HarleyVader/` → `platform/` + `docs/philosophy/` + `docs/projects/`
- `KRYSSIE/` → `docs/languages/codecraft/` + `languages/codecraft/`

Original folders preserved in `.OLD/` for reference.

---

**Last Updated**: 2025-11-03  
**Architecture**: Unified workspace (content + platform + specs)
