# 📂 Codebase Documentation Index

**Organized folder structure for the MCP Control Tower documentation.**

---

## 📁 Directory Structure

```
.github/docs/codebase/
│
├── README.md                        ⭐ START HERE - Main navigation hub
├── INDEX.md                         📋 This file - folder organization guide
├── COMPLETION_REPORT.md            📊 Documentation delivery metrics
│
├── core/                           🏗️ SYSTEM FUNDAMENTALS
│   ├── architecture.md             Three-layer system design, component interaction
│   └── commentomancy.md            Code documentation system (Law/Lore/Ritual)
│
├── api/                            🌐 EXTERNAL INTERFACES
│   ├── api-reference.md            Complete HTTP REST and WebSocket API
│   ├── integration-points.md       Configuration, environment variables
│   └── state-machines.md           ServerState and AgentState FSM diagrams
│
├── implementation/                 💻 CODE STRUCTURE
│   ├── modules.md                  Complete module reference (all 5 source files)
│   ├── patterns.md                 Implementation patterns (event-driven, state)
│   ├── conventions.md              Coding standards (naming, logging, errors)
│   └── error-handling.md           Error types and recovery strategies
│
└── guides/                         📚 QUICK START
    ├── development-workflow.md     Setup, npm scripts, VS Code integration
    └── quick-reference.md          One-page cheat sheet for rapid lookup
```

---

## 🗂️ Documentation Categories

### 🏗️ Core System (`core/`)

**Purpose**: Foundational architecture and documentation principles

**Files**:
- `architecture.md` - How the system is designed (three-layer architecture)
- `commentomancy.md` - How code is documented (sigils and patterns)

**When to use**: Understanding system fundamentals, learning the codebase structure

---

### 🌐 API & Integration (`api/`)

**Purpose**: External interfaces and communication protocols

**Files**:
- `api-reference.md` - HTTP endpoints and WebSocket protocol
- `integration-points.md` - Configuration and environment setup
- `state-machines.md` - Valid state transitions for servers and agents

**When to use**: Integrating with the system, building clients, understanding state flow

---

### 💻 Implementation (`implementation/`)

**Purpose**: Code organization, patterns, and best practices

**Files**:
- `modules.md` - Detailed reference for each source file
- `patterns.md` - Reusable implementation patterns
- `conventions.md` - Coding standards and style guide
- `error-handling.md` - Error types and recovery workflows

**When to use**: Writing new code, understanding existing modules, debugging issues

---

### 📚 Guides (`guides/`)

**Purpose**: Practical workflows and quick reference

**Files**:
- `development-workflow.md` - How to set up and develop
- `quick-reference.md` - Rapid lookup for common tasks

**When to use**: Getting started, daily reference, quick answers

---

## 🎯 Quick Navigation by Task

### 🆕 "I'm new to this project"
1. Start: [README.md](README.md) → Overview and navigation
2. Quick start: [guides/quick-reference.md](guides/quick-reference.md) → One-page overview
3. Architecture: [core/architecture.md](core/architecture.md) → System design
4. Setup: [guides/development-workflow.md](guides/development-workflow.md) → Environment

### 💻 "I need to write code"
1. Modules: [implementation/modules.md](implementation/modules.md) → Source file reference
2. Patterns: [implementation/patterns.md](implementation/patterns.md) → How to implement
3. Conventions: [implementation/conventions.md](implementation/conventions.md) → Style guide
4. Docs: [core/commentomancy.md](core/commentomancy.md) → How to document

### 🌐 "I need to integrate via API"
1. API: [api/api-reference.md](api/api-reference.md) → Complete endpoint docs
2. Config: [api/integration-points.md](api/integration-points.md) → Environment setup
3. States: [api/state-machines.md](api/state-machines.md) → Valid transitions
4. Errors: [implementation/error-handling.md](implementation/error-handling.md) → Error handling

### 🐛 "I need to debug an issue"
1. Quick: [guides/quick-reference.md](guides/quick-reference.md) → Common issues
2. Errors: [implementation/error-handling.md](implementation/error-handling.md) → Recovery
3. States: [api/state-machines.md](api/state-machines.md) → State problems
4. Advanced: [../debugging-guide.md](../debugging-guide.md) → Deep troubleshooting

### 🚀 "I need to deploy"
1. Docker: [../docker-deployment.md](../docker-deployment.md) → Containerization
2. CI/CD: [../ci-cd-pipeline.md](../ci-cd-pipeline.md) → Automation
3. Monitoring: [../dashboard-ui.md](../dashboard-ui.md) → Observability
4. Operations: [implementation/error-handling.md](implementation/error-handling.md) → Production

---

## 📊 Documentation Statistics

| Category | Files | Total Lines | Coverage |
|----------|-------|-------------|----------|
| Core System | 2 | ~1,500 | Architecture, docs system |
| API & Integration | 3 | ~2,000 | HTTP, WebSocket, states |
| Implementation | 4 | ~3,500 | Modules, patterns, errors |
| Guides | 2 | ~1,000 | Workflow, quick reference |
| **Total** | **11** | **~8,000** | **100% complete** |

---

## 🔗 Cross-Reference Map

### From Core
- `architecture.md` → References all categories
- `commentomancy.md` → Used by all implementation docs

### From API
- `api-reference.md` → References modules, error-handling
- `integration-points.md` → References architecture, modules
- `state-machines.md` → References modules, error-handling, patterns

### From Implementation
- `modules.md` → References architecture, api-reference, state-machines
- `patterns.md` → References architecture, modules
- `conventions.md` → References architecture, commentomancy
- `error-handling.md` → References state-machines, modules

### From Guides
- `development-workflow.md` → References architecture, conventions
- `quick-reference.md` → References all documentation files

---

## 🎨 Organization Principles

### 1. **Hierarchical Structure**
- Top-level files (`README.md`, `INDEX.md`) provide navigation
- Subdirectories organize by purpose, not by file type
- Clear separation between system fundamentals, APIs, and implementation

### 2. **Logical Grouping**
- **Core**: What doesn't change (architecture, principles)
- **API**: What external users need (interfaces, integration)
- **Implementation**: What developers need (code, patterns, standards)
- **Guides**: What practitioners need (workflows, quick answers)

### 3. **Consistent Naming**
- Folder names: lowercase, singular noun describing category
- File names: lowercase-with-hyphens.md
- All references use relative paths from file location

### 4. **Cross-Reference Strategy**
- All internal links use relative paths (`../category/file.md`)
- Same-directory links use simple paths (`file.md`)
- Parent directory docs use `../filename.md`
- All paths validated and working

---

## 📝 Maintenance Guidelines

### Adding New Documentation

1. **Determine category**: Which folder does it belong in?
   - System design → `core/`
   - API/integration → `api/`
   - Code patterns → `implementation/`
   - Workflow/guide → `guides/`

2. **Create file**: Use lowercase-with-hyphens.md naming

3. **Update README.md**: Add entry in appropriate section

4. **Add cross-references**: Link to/from related docs

5. **Test paths**: Verify all links work from new file location

### Moving Files

1. **Update file location**: Move to appropriate subdirectory

2. **Fix internal references**: Update links within the moved file
   - Same directory: `file.md`
   - Other directory: `../category/file.md`
   - Parent directory: `../../file.md`

3. **Find and fix external references**: 
   ```bash
   grep -r "oldfilename.md" --include="*.md"
   ```

4. **Test all links**: Verify no broken references

### Reorganizing Structure

1. **Document current structure**: Create backup or commit

2. **Plan new structure**: Sketch out folder hierarchy

3. **Move files in batches**: One category at a time

4. **Update references incrementally**: Use sed or manual updates

5. **Validate**: Test all documentation links

---

## 🚦 Navigation Status

✅ **All files organized** into logical categories  
✅ **All cross-references updated** to new paths  
✅ **All internal links validated** and working  
✅ **Navigation hub complete** in README.md  
✅ **Index guide created** for structure overview  

**Organization status**: 🟢 **COMPLETE**

---

## 📚 Related Documentation

**Parent directory** (`.github/docs/`):
- `testing-guide.md` - Jest patterns and coverage
- `dashboard-ui.md` - Frontend implementation
- `docker-deployment.md` - Container deployment
- `ci-cd-pipeline.md` - GitHub Actions workflow
- `debugging-guide.md` - Troubleshooting guide
- `advanced-patterns.md` - Production patterns

**Root directory**:
- `README.md` - Project overview
- `TODO.md` - Current tasks
- `BUILD.md` - Build instructions

---

**Last Updated**: November 3, 2025  
**Documentation Version**: 2.0 (Organized Structure)  
**Maintained By**: BambiSleep™ Church Development Team
