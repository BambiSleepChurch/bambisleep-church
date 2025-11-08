#!/bin/bash
# Coordinator for Terminal 4: Orchestrator (Dashboard)
ORCH_DIR="/mnt/f/.orchestration"
source "$ORCH_DIR/shared-functions.sh"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         TERMINAL 4: ORCHESTRATOR LEAD                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
coord_log "Terminal 4 initialized - Starting live monitor"
signal_ready "terminal4"
wait_for_terminals 4

coord_log "All terminals synchronized! Monitoring..."

while true; do
    clear
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║            LIVE ORCHESTRATION DASHBOARD                   ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo "Time: $(date +%H:%M:%S)"
    echo ""
    
    echo "Terminal Status:"
    for i in 1 2 3; do
        if [[ -f "$ORCH_DIR/signals/terminal${i}_complete" ]]; then
            echo "  ✓ Terminal $i: COMPLETE"
        elif [[ -f "$ORCH_DIR/signals/terminal${i}_ready" ]]; then
            echo "  ● Terminal $i: WORKING"
        else
            echo "  ○ Terminal $i: WAITING"
        fi
    done
    echo ""
    
    echo "Queue: $(ls "$ORCH_DIR/queue"/*.task 2>/dev/null | wc -l) pending"
    echo ""
    
    if [[ -f "$ORCH_DIR/signals/terminal3_complete" ]]; then
        coord_log "✓✓✓ ALL PHASES COMPLETE! ✓✓✓"
        signal_complete "terminal4"
        break
    fi
    
    sleep 2
done

coord_log "Orchestration complete! Check: $ORCH_DIR/work/"
