#!/bin/bash
# Coordinator for Terminal 3: Builder Lead
ORCH_DIR="/mnt/f/.orchestration"
source "$ORCH_DIR/shared-functions.sh"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         TERMINAL 3: BUILDER LEAD                          ║"
echo "╚════════════════════════════════════════════════════════════╝"
coord_log "Terminal 3 initialized"
signal_ready "terminal3"
wait_for_terminals 4

coord_log "Waiting for write phase..."
wait_for_signal "terminal2_complete"

coord_log "Starting build phase..."

for project in /mnt/f/bambisleep-chat /mnt/f/CATHEDRAL /mnt/f/FRINGESOCIAL; do
    [[ -d "$project" ]] && enqueue_task "build" "$project" &
done
wait

coord_log "✓ Build tasks enqueued!"
signal_complete "terminal3"
