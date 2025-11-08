#!/bin/bash
# List all tasks and their status

COORD_DIR=".copilot-coordination"
QUEUE_DIR="$COORD_DIR/queue"

echo "📋 TASK QUEUE STATUS"
echo "===================="
echo ""

if [ ! -d "$QUEUE_DIR" ] || [ -z "$(ls -A "$QUEUE_DIR" 2>/dev/null)" ]; then
    echo "No tasks in queue"
    exit 0
fi

for task_file in "$QUEUE_DIR"/*.json; do
    [ -f "$task_file" ] || continue
    
    task_id=$(jq -r '.id' "$task_file")
    role=$(jq -r '.role' "$task_file")
    status=$(jq -r '.status' "$task_file")
    title=$(jq -r '.title' "$task_file")
    assigned=$(jq -r '.assigned_to // "none"' "$task_file")
    
    case $status in
        pending) icon="⏳" ;;
        in_progress) icon="🔄" ;;
        completed) icon="✅" ;;
        failed) icon="❌" ;;
        *) icon="❓" ;;
    esac
    
    echo "$icon [$role] $task_id"
    echo "   Status: $status | Assigned: $assigned"
    echo "   Title: $title"
    echo ""
done
