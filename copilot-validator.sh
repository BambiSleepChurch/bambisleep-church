#!/bin/bash
# Copilot Validator Worker
# Role: Test, lint, validate changes, run builds

COORD_DIR=".copilot-coordination"
TERMINAL_ID="terminal-4"
ROLE="validator"
STATUS_FILE="$COORD_DIR/status/${TERMINAL_ID}.json"
LOG_FILE="$COORD_DIR/logs/${TERMINAL_ID}.log"
QUEUE_DIR="$COORD_DIR/queue"
LOCK_DIR="$COORD_DIR/locks"

# Initialize
mkdir -p "$COORD_DIR/status" "$COORD_DIR/logs" "$LOCK_DIR"
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

echo "[$(date -Iseconds)] Validator started" >> "$LOG_FILE"
echo "✅ VALIDATOR TERMINAL ACTIVE"
echo "============================"
echo "This terminal handles testing, linting, and validation."
echo ""
echo "Waiting for 'validator' tasks..."
echo "Ask me to test, lint, build, or validate code."
echo ""
echo "Press Ctrl+C to stop"
echo "============================"

trap 'rm -f "$LOCK_DIR/${TERMINAL_ID}.lock"; echo "Validator stopped"' EXIT

TASKS_COMPLETED=0
while true; do
    jq --arg time "$(date -Iseconds)" '.last_heartbeat = $time' "$STATUS_FILE" > "$STATUS_FILE.tmp" && mv "$STATUS_FILE.tmp" "$STATUS_FILE" 2>/dev/null || true
    
    for task_file in "$QUEUE_DIR"/*.json 2>/dev/null; do
        [ -f "$task_file" ] || continue
        
        task_role=$(jq -r '.role' "$task_file" 2>/dev/null)
        task_status=$(jq -r '.status' "$task_file" 2>/dev/null)
        task_id=$(jq -r '.id' "$task_file" 2>/dev/null)
        
        if [ "$task_role" = "$ROLE" ] && [ "$task_status" = "pending" ]; then
            lock_file="$LOCK_DIR/${task_id}.lock"
            if mkdir "$lock_file" 2>/dev/null; then
                echo "[$(date -Iseconds)] 📋 Acquired task: $task_id" | tee -a "$LOG_FILE"
                
                jq '.status = "in_progress" | .assigned_to = "'$TERMINAL_ID'" | .started_at = "'$(date -Iseconds)'"' "$task_file" > "$task_file.tmp" && mv "$task_file.tmp" "$task_file"
                jq '.current_task = "'$task_id'"' "$STATUS_FILE" > "$STATUS_FILE.tmp" && mv "$STATUS_FILE.tmp" "$STATUS_FILE"
                
                task_title=$(jq -r '.title' "$task_file")
                task_desc=$(jq -r '.description' "$task_file")
                echo ""
                echo "📌 TASK: $task_title"
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                echo "$task_desc"
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                echo ""
                echo "⏳ Waiting for your validation..."
                echo "   Tell me when you're done or say 'complete task'"
                
                break
            fi
        fi
    done
    
    sleep 2
done
