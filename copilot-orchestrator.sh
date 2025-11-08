#!/bin/bash
# Copilot Orchestrator Worker
# Role: Create tasks, monitor progress, coordinate workflow

COORD_DIR=".copilot-coordination"
TERMINAL_ID="terminal-1"
ROLE="orchestrator"
STATUS_FILE="$COORD_DIR/status/${TERMINAL_ID}.json"
LOG_FILE="$COORD_DIR/logs/${TERMINAL_ID}.log"

# Initialize status
mkdir -p "$COORD_DIR/status" "$COORD_DIR/logs"
cat > "$STATUS_FILE" <<EOF
{
  "terminal_id": "$TERMINAL_ID",
  "role": "$ROLE",
  "status": "active",
  "started_at": "$(date -Iseconds)",
  "last_heartbeat": "$(date -Iseconds)",
  "current_task": null,
  "tasks_completed": 0
}
EOF

echo "[$(date -Iseconds)] Orchestrator started" >> "$LOG_FILE"
echo "🎯 ORCHESTRATOR TERMINAL ACTIVE"
echo "================================"
echo "This terminal coordinates the overall workflow."
echo ""
echo "Commands available:"
echo "  ./create-task.sh <role> <description>  - Create a new task"
echo "  ./list-tasks.sh                        - List all tasks"
echo "  ./monitor-status.sh                    - Monitor worker status"
echo ""
echo "Ask me to:"
echo "  - 'Create tasks for...' - I'll generate task queue"
echo "  - 'Show task status' - See what's happening"
echo "  - 'Monitor workers' - Check worker health"
echo ""
echo "Press Ctrl+C to stop"
echo "================================"

# Heartbeat loop
while true; do
    jq --arg time "$(date -Iseconds)" '.last_heartbeat = $time' "$STATUS_FILE" > "$STATUS_FILE.tmp" && mv "$STATUS_FILE.tmp" "$STATUS_FILE"
    sleep 5
done
