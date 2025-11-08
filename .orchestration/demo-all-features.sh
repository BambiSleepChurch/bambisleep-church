#!/bin/bash
# Comprehensive demo of all orchestration features

ORCH_DIR="/mnt/f/.orchestration"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     ORCHESTRATION SYSTEM - FULL FEATURE DEMO              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "🚀 Starting workers..."
bash "$ORCH_DIR/master-orchestrator.sh" start
sleep 3

echo ""
echo "📊 Status check:"
bash "$ORCH_DIR/master-orchestrator.sh" status

echo ""
echo "📝 Enqueueing inspection tasks..."
bash "$ORCH_DIR/master-orchestrator.sh" enqueue inspect /mnt/f/bambisleep-chat
bash "$ORCH_DIR/master-orchestrator.sh" enqueue inspect /mnt/f/CATHEDRAL
bash "$ORCH_DIR/master-orchestrator.sh" enqueue inspect /mnt/f/FRINGESOCIAL

echo ""
echo "⏳ Waiting for workers to process (10 seconds)..."
sleep 10

echo ""
echo "📋 Inspection results:"
ls -lh "$ORCH_DIR/work/inspection-results/" 2>/dev/null | tail -5

echo ""
echo "📂 Sample inspection report:"
latest_json=$(ls -t "$ORCH_DIR/work/inspection-results"/*.json 2>/dev/null | head -1)
if [[ -f "$latest_json" ]]; then
    echo "File: $latest_json"
    head -20 "$latest_json"
fi

echo ""
echo "📝 Testing parallel execution..."
bash "$ORCH_DIR/master-orchestrator.sh" parallel \
    "echo 'Parallel task 1 complete'" \
    "echo 'Parallel task 2 complete'" \
    "echo 'Parallel task 3 complete'"

echo ""
echo "📊 Final status:"
bash "$ORCH_DIR/master-orchestrator.sh" status

echo ""
echo "✅ Demo complete! Workers still running in background."
echo ""
echo "Next steps:"
echo "  - Watch live: bash $ORCH_DIR/master-orchestrator.sh watch"
echo "  - Check logs: tail -f $ORCH_DIR/logs/*.log"
echo "  - Stop system: bash $ORCH_DIR/master-orchestrator.sh stop"
