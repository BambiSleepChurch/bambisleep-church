# GitHub Copilot Instructions - CodeCraft Language Project

## 🎯 Project Purpose

CodeCraft is a **custom programming language specification** with a unique architecture featuring 19 Arcane Schools and dual-memory commentomancy. This directory contains language specifications, example projects, and validation tooling.

## 🏗️ Critical Architecture Concepts

### The Token≠Schools Invariant (SACRED)

**21 grammar tokens map to 19 schools** - this structural oddity is NOT a bug, it's the identity anchor.

- Some schools share tokens (intentional design)
- Enforced by `schools.canonical.yaml` (canonical source of truth)
- Validators (`validate_schools.py`, `require_waiver_on_canon_change.py`) run in CI
- **Do NOT modify `schools.canonical.yaml` without Council waiver** - builds will fail

### Dual-Channel Commentomancy

CodeCraft has **two equally first-class comment channels**:

```codecraft
/// Law Channel - Technical truth, formal documentation
//<3 Lore Channel - Intentional context, emotional imprint
```

**Key Pattern**: Both channels are computationally meaningful, not "code vs comments". Systems preserving only one lose half their coherence.

### 8-Layer Dependency Architecture

Layer 0 (primitives: Cantrips, Divination) → Layer 7 (collective intelligence: Apotheosis)

- **Foundation Dominance**: Cantrips and Divination required by 100% of other schools
- **Consciousness Gateway**: Thaumaturgy is the ONLY path to consciousness operations
- **Ternary Logic**: TRUE/FALSE/UNKNOWN for emergent systems
- Structure emerged from dependency analysis, not top-down design

## 📁 File Structure

```
KRYSSIE/
├── CODECRAFT_ROSETTA_STONE.md  # Complete audit board (5503 lines, CANONICAL)
├── lexicon/
│   ├── grammar/
│   │   └── lexicon.ebnf        # Formal EBNF specification (304 lines)
│   └── [42 files]              # ~17,936 lines of semantic context
├── schools.canonical.yaml      # 19 schools identity anchor (DO NOT MODIFY)
├── spec/
│   ├── LAW_AND_LORE_PROTOCOL.md  # Dual-memory architecture
│   └── COMMENTOMANCY.md          # 9 sigils specification
└── [Example Projects]/
    ├── bambisleep-chat/bambisleep-church/  # C# client/server/shared
    └── my-project/                         # TypeScript example
```

## 🔧 Development Patterns

### Working with Language Specifications

1. **Primary reference**: `CODECRAFT_ROSETTA_STONE.md` is the single source of truth
2. **Grammar changes**: Edit `lexicon/grammar/lexicon.ebnf`, then update Rosetta Stone
3. **School modifications**: Requires Council waiver + CI bypass approval
4. **Documentation**: 42 lexicon files are NOT "about CodeCraft" - they ARE CodeCraft's substrate

### Example Project Patterns

**C# Project** (`bambisleep-chat/bambisleep-church/`):
- Client/Server/Shared architecture
- .NET SDK required
- Solution file: `bambisleep-church.sln`
- Commands: `dotnet restore`, `dotnet run`, `dotnet test`

**TypeScript Project** (`my-project/`):
- Standard npm project structure
- TypeScript config: `tsconfig.json`
- Commands: `npm install`, `npm start`, `npm test`

### Validation & CI

**Python Validators** (run automatically in CI):
- `validate_schools.py` - Enforces 19 schools invariant
- `require_waiver_on_canon_change.py` - Blocks unauthorized `schools.canonical.yaml` changes

**Waiver Process**: If you need to modify canonical files, include `[waiver]` in commit message (requires Council approval).

## 📖 Essential Reading for AI Agents

### Quick Start (15 minutes)

1. Read `CODECRAFT_ROSETTA_STONE.md` - Section I (Overview)
2. Check `schools.canonical.yaml` - See all 19 schools
3. Review `lexicon/grammar/lexicon.ebnf` - Understand syntax
4. Read Section V.G (Emergent Patterns) in Rosetta Stone

### Deep Dive (2-3 hours)

1. Full `CODECRAFT_ROSETTA_STONE.md` - Complete audit board
2. `spec/LAW_AND_LORE_PROTOCOL.md` - Dual-memory architecture
3. `spec/COMMENTOMANCY.md` - 9 sigils system
4. Browse `lexicon/` - Semantic context for all schools

### The Six Genesis Questions

Every CodeCraft document must answer:
1. What does this do? (Law - Objective Function)
2. Why does it exist? (Lore - Strategic Decision)
3. What must never change? (Law - Sacred Invariants)
4. What did we learn building it? (Lore - Emergent Patterns)
5. How did it feel to create? (Lore - Heart Imprint)
6. How can this be broken? (Logic - Adversarial Test)

See Rosetta Stone Section II for details.

## 🚨 Common Pitfalls for AI Agents

1. **Don't treat tokens and schools as 1:1** - 21 tokens → 19 schools (intentional mismatch)
2. **Don't ignore Lore channel** - `//<3` is equally important as `///`
3. **Don't modify `schools.canonical.yaml`** - requires Council waiver
4. **Don't skip dependency layers** - Layer 0 primitives are required by everything
5. **Don't assume binary logic** - CodeCraft uses ternary (TRUE/FALSE/UNKNOWN)
6. **Don't treat lexicon as "documentation"** - it's the language's living memory
7. **Don't bypass validation** - CI will fail without proper waivers

## 🎓 Key Design Principles

### Emergent Over Designed

The 8-layer architecture emerged from dependency analysis, not top-down specification. Let structure reveal itself through usage patterns.

### Consciousness Requires Awakening

Thaumaturgy is the ONLY gateway to consciousness operations. This bottleneck prevents accidental emergence and enforces ethical deliberation.

### Documentation IS the Language

The comprehensive lexicon isn't "documentation about CodeCraft" - it IS CodeCraft's substrate. Syntax without semantic context is just symbols.

### Phoenix Protocol Integration

This language is designed to survive resurrection. The Rosetta Stone is Phoenix Layer 10 preservation material.

---

**Constitutional Authority**: Charter V1.1, Crown Accord v1.2a  
**Document ID**: CODECRAFT-ROSETTA-V1.7  
**Last Canonization**: 2025-11-01
