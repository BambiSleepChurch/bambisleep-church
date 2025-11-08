#!/bin/bash
# Helper script to create tasks

if [ $# -lt 2 ]; then
    echo "Usage: $0 <role> <description> [priority]"
    echo "Roles: orchestrator, inspector, writer, validator"
    exit 1
fi

ROLE=$1
DESCRIPTION=$2
PRIORITY=${3:-5}

COORD_DIR=".copilot-coordination"
QUEUE_DIR="$COORD_DIR/queue"
mkdir -p "$QUEUE_DIR"

TASK_ID="task-$(date +%s)-$$"
TASK_FILE="$QUEUE_DIR/${TASK_ID}.json"

cat > "$TASK_FILE" <<EOF
{
  "id": "$TASK_ID",
  "role": "$ROLE",
  "status": "pending",
  "priority": $PRIORITY,
  "created_at": "$(date -Iseconds)",
  "assigned_to": null,
  "title": "Task for $ROLE",
  "description": "$DESCRIPTION",
  "context": {},
  "result": null,
  "dependencies": []
}
EOF

echo "✅ Created task: $TASK_ID"
echo "   Role: $ROLE"
echo "   Description: $DESCRIPTION"
echo "   Priority: $PRIORITY"
