# TODO: Complete Build Instructions

## Missing Build Components

### Package.json Setup
- [ ] Create `package.json` with proper Node.js 20+ LTS dependencies
- [ ] Add build scripts referenced in RELIGULOUS_MANTRA.md:
  - `npm test -- --coverage=100`
  - `npm run build -- --universal`
  - `npm run deploy -- --aigf-mode`
- [ ] Configure Volta pinning for Node.js 20 LTS

### Unity Integration
- [ ] Install Unity Hub and Unity 6.2 LTS (6000.2.11f1)
- [ ] Test Unity project creation with provided structure
- [ ] Verify Unity package dependencies load correctly
- [ ] Create sample CatgirlController.cs to test compilation

### MCP Server Testing
- [ ] Install and test all 8 MCP servers:
  - filesystem, git, github, memory, sequential-thinking, everything
  - brave-search, postgres (via uvx)
- [ ] Verify VS Code MCP integration works
- [ ] Test MCP server connectivity status

### Container Build Pipeline
- [ ] Create Dockerfile with proper labels
- [ ] Set up GitHub Actions for container builds
- [ ] Configure GHCR registry push permissions
- [ ] Test semantic versioning tag workflow

### Development Environment Verification
- [ ] Verify Node.js 20 LTS installation
- [ ] Test Volta configuration
- [ ] Confirm all development dependencies resolve
- [ ] Run initial build/test cycle

### Documentation Completion
- [ ] Add troubleshooting section to build.md
- [ ] Include environment setup verification steps
- [ ] Document common build failure resolutions
- [ ] Add "Quick Start" section for new developers

## Priority Order

1. **Package.json & Node.js** - Foundation for all other builds
2. **MCP Server Setup** - Core development tool integration
3. **Unity Project Init** - Game development foundation
4. **Container Pipeline** - Deployment infrastructure
5. **Documentation** - Developer onboarding support

## Blockers to Address

- Missing package.json means npm commands will fail
- Unity 6.2 installation may require manual setup
- MCP servers need proper environment configuration
- Container registry permissions need setup
- Build scripts are referenced but not defined

## Success Criteria

Build is complete when:
- ✅ `npm test -- --coverage=100` runs successfully
- ✅ All 8 MCP servers show "Connected" in VS Code
- ✅ Unity project opens without errors
- ✅ Container builds and pushes to GHCR
- ✅ New developer can follow build.md start-to-finish