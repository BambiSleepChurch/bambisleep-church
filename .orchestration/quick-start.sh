#!/bin/bash
ORCH_DIR="/mnt/f/.orchestration"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     COPILOT CLI ORCHESTRATION - QUICK START               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
chmod +x "$ORCH_DIR"/*.sh
echo "Starting orchestration system..."
bash "$ORCH_DIR/master-orchestrator.sh" start
sleep 2
echo ""
bash "$ORCH_DIR/master-orchestrator.sh" status
echo ""
echo "Enqueueing sample tasks..."
bash "$ORCH_DIR/master-orchestrator.sh" enqueue inspect /mnt/f/bambisleep-chat
bash "$ORCH_DIR/master-orchestrator.sh" enqueue inspect /mnt/f/CATHEDRAL
echo ""
echo "✓ System started! Workers processing in background."
echo ""
echo "Commands:"
echo "  bash $ORCH_DIR/master-orchestrator.sh status"
echo "  bash $ORCH_DIR/master-orchestrator.sh watch"
echo "  bash $ORCH_DIR/master-orchestrator.sh stop"
