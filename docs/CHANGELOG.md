# Changelog

All notable changes to the BambiSleep™ Church MCP Control Tower project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial project structure with devcontainer configuration
- MCP server configuration for filesystem, git, and github servers
- VS Code settings with Copilot, Prettier, and Tailwind CSS support
- Dockerfile with OCI-compliant organization labels
- AI agent instructions in `.github/copilot-instructions.md`
- Organization branding documentation in `docs/CONTAINER_ORGANIZATION.md`
- Development philosophy in `docs/RELIGULOUS_MANTRA.md`
- Dependabot configuration for devcontainer updates
- Created `docs/` folder for documentation

### Changed

- Renamed organization from BambiSleepChat to BambiSleepChurch across all files
- Updated package scope to `@bambisleepchurch/bambisleep-church`
- Updated all GitHub URLs to point to BambiSleepChurch organization
- Updated container registry to `ghcr.io/bambisleepchurch`
- Moved documentation files to `docs/` folder

### Infrastructure

- Node.js 20+ LTS runtime environment
- Port 3000 reserved for Control Tower Dashboard
- Port 8080 reserved for API endpoints
- Pre-installed MCP SDK in container image

## [1.0.0] - TBD

### Planned

- Core `src/` implementation
- MCP server orchestration logic
- Control Tower Dashboard UI
- REST API endpoints
- MongoDB, Stripe, HuggingFace, Azure Quantum, and Clarity MCP server integrations
