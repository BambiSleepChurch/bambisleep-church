#!/bin/bash
# Coordinator for Terminal 1: Inspector Lead
ORCH_DIR="/mnt/f/.orchestration"
source "$ORCH_DIR/shared-functions.sh"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         TERMINAL 1: INSPECTOR LEAD                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
coord_log "Terminal 1 initialized"
signal_ready "terminal1"
wait_for_terminals 4

coord_log "All terminals ready! Starting inspection..."

projects=("/mnt/f/bambisleep-chat" "/mnt/f/CATHEDRAL" "/mnt/f/FRINGESOCIAL")
for project in "${projects[@]}"; do
    [[ -d "$project" ]] && enqueue_task "inspect" "$project" &
done
wait

coord_log "✓ Inspections enqueued! Monitor with: bash $ORCH_DIR/master-orchestrator.sh watch"
signal_complete "terminal1"
