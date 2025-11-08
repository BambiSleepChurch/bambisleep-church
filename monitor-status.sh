#!/bin/bash
# Monitor worker status

COORD_DIR=".copilot-coordination"
STATUS_DIR="$COORD_DIR/status"

echo "🖥️  WORKER STATUS"
echo "================"
echo ""

if [ ! -d "$STATUS_DIR" ] || [ -z "$(ls -A "$STATUS_DIR" 2>/dev/null)" ]; then
    echo "No active workers"
    exit 0
fi

for status_file in "$STATUS_DIR"/*.json; do
    [ -f "$status_file" ] || continue
    
    terminal_id=$(jq -r '.terminal_id' "$status_file")
    role=$(jq -r '.role' "$status_file")
    status=$(jq -r '.status' "$status_file")
    started=$(jq -r '.started_at' "$status_file")
    heartbeat=$(jq -r '.last_heartbeat' "$status_file")
    current_task=$(jq -r '.current_task // "idle"' "$status_file")
    completed=$(jq -r '.tasks_completed' "$status_file")
    
    # Check if heartbeat is recent (within 30 seconds)
    heartbeat_epoch=$(date -d "$heartbeat" +%s 2>/dev/null || echo 0)
    now_epoch=$(date +%s)
    age=$((now_epoch - heartbeat_epoch))
    
    if [ $age -lt 30 ]; then
        health="🟢 ACTIVE"
    else
        health="🔴 STALE"
    fi
    
    echo "$health $terminal_id - $role"
    echo "   Started: $started"
    echo "   Current task: $current_task"
    echo "   Completed: $completed tasks"
    echo ""
done
