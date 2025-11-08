# Multi-Terminal Copilot Coordination System

## Architecture

This system enables multiple Copilot CLI terminals to work together on a codebase through a shared task queue.

### Terminals and Roles

1. **Terminal 1 - Orchestrator**: Creates tasks, monitors progress, coordinates workflow
2. **Terminal 2 - Inspector**: Reads files, analyzes code, explores structure
3. **Terminal 3 - Writer**: Creates/modifies files based on specifications
4. **Terminal 4 - Validator**: Runs tests, linters, builds to validate changes

## Directory Structure

```
.copilot-coordination/
├── queue/           # Task queue files (one per task)
├── locks/           # Lock files to prevent race conditions
├── status/          # Status files for each terminal
├── logs/            # Execution logs
├── config.json      # System configuration
└── task_queue.json  # Master task list
```

## Usage

### Start Workers

In each terminal, run the appropriate worker script:

```bash
# Terminal 1 (Orchestrator)
./copilot-orchestrator.sh

# Terminal 2 (Inspector)
./copilot-inspector.sh

# Terminal 3 (Writer)
./copilot-writer.sh

# Terminal 4 (Validator)
./copilot-validator.sh
```

### Create Tasks (from Orchestrator terminal)

Use the helper script:
```bash
./create-task.sh "inspect" "Analyze bambisleep-chat structure"
./create-task.sh "write" "Create new React component for chat interface"
./create-task.sh "validate" "Run tests on bambisleep-chat"
```

## Task Flow

1. Orchestrator creates tasks and adds them to queue
2. Workers poll queue for tasks matching their role
3. Worker acquires lock, processes task, updates status
4. Orchestrator monitors completion and creates follow-up tasks
5. Validator checks work and reports results

## Task Format

```json
{
  "id": "task-<timestamp>-<random>",
  "role": "inspector|writer|validator|orchestrator",
  "status": "pending|in_progress|completed|failed",
  "priority": 1-10,
  "created_at": "ISO timestamp",
  "assigned_to": "terminal-id",
  "title": "Brief description",
  "description": "Detailed instructions",
  "context": {},
  "result": {},
  "dependencies": ["task-id-1", "task-id-2"]
}
```

## Stopping the System

Press Ctrl+C in any terminal to stop that worker gracefully.
