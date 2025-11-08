#!/bin/bash
# Mark a task as completed

if [ $# -lt 1 ]; then
    echo "Usage: $0 <task-id> [result-message]"
    exit 1
fi

TASK_ID=$1
RESULT=${2:-"Task completed"}

COORD_DIR=".copilot-coordination"
QUEUE_DIR="$COORD_DIR/queue"
LOCK_DIR="$COORD_DIR/locks"

TASK_FILE="$QUEUE_DIR/${TASK_ID}.json"
LOCK_FILE="$LOCK_DIR/${TASK_ID}.lock"

if [ ! -f "$TASK_FILE" ]; then
    echo "❌ Task not found: $TASK_ID"
    exit 1
fi

# Update task
jq --arg result "$RESULT" --arg time "$(date -Iseconds)" \
   '.status = "completed" | .result = $result | .completed_at = $time' \
   "$TASK_FILE" > "$TASK_FILE.tmp" && mv "$TASK_FILE.tmp" "$TASK_FILE"

# Release lock
rm -rf "$LOCK_FILE" 2>/dev/null

echo "✅ Task completed: $TASK_ID"
echo "   Result: $RESULT"
