#!/bin/bash
# Copilot Inspector Worker
# Role: Analyze files, explore codebase, report findings

COORD_DIR=".copilot-coordination"
TERMINAL_ID="terminal-2"
ROLE="inspector"
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

echo "[$(date -Iseconds)] Inspector started" >> "$LOG_FILE"
echo "🔍 INSPECTOR TERMINAL ACTIVE"
echo "============================"
echo "This terminal handles file inspection and code analysis."
echo ""
echo "Waiting for 'inspector' tasks..."
echo "Ask me to analyze, explore, or inspect files/code."
echo ""
echo "Press Ctrl+C to stop"
echo "============================"

# Cleanup on exit
trap 'rm -f "$LOCK_DIR/${TERMINAL_ID}.lock"; echo "Inspector stopped"' EXIT

# Main loop
TASKS_COMPLETED=0
while true; do
    # Update heartbeat
    jq --arg time "$(date -Iseconds)" '.last_heartbeat = $time' "$STATUS_FILE" > "$STATUS_FILE.tmp" && mv "$STATUS_FILE.tmp" "$STATUS_FILE" 2>/dev/null || true
    
    # Look for inspector tasks
    for task_file in "$QUEUE_DIR"/*.json 2>/dev/null; do
        [ -f "$task_file" ] || continue
        
        # Check if task is for inspector and pending
        task_role=$(jq -r '.role' "$task_file" 2>/dev/null)
        task_status=$(jq -r '.status' "$task_file" 2>/dev/null)
        task_id=$(jq -r '.id' "$task_file" 2>/dev/null)
        
        if [ "$task_role" = "$ROLE" ] && [ "$task_status" = "pending" ]; then
            # Try to acquire lock
            lock_file="$LOCK_DIR/${task_id}.lock"
            if mkdir "$lock_file" 2>/dev/null; then
                echo "[$(date -Iseconds)] 📋 Acquired task: $task_id" | tee -a "$LOG_FILE"
                
                # Update task status
                jq '.status = "in_progress" | .assigned_to = "'$TERMINAL_ID'" | .started_at = "'$(date -Iseconds)'"' "$task_file" > "$task_file.tmp" && mv "$task_file.tmp" "$task_file"
                
                # Update terminal status
                jq '.current_task = "'$task_id'"' "$STATUS_FILE" > "$STATUS_FILE.tmp" && mv "$STATUS_FILE.tmp" "$STATUS_FILE"
                
                # Show task
                task_title=$(jq -r '.title' "$task_file")
                task_desc=$(jq -r '.description' "$task_file")
                echo ""
                echo "📌 TASK: $task_title"
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                echo "$task_desc"
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                echo ""
                echo "⏳ Waiting for your analysis..."
                echo "   Tell me when you're done or say 'complete task'"
                
                # Wait for manual completion signal
                # (In practice, you'd process and update the task)
                break
            fi
        fi
    done
    
    sleep 2
done
