#!/bin/bash
# Worker: Builder
set -euo pipefail
ORCH_DIR="/mnt/f/.orchestration"
QUEUE_DIR="$ORCH_DIR/queue"
WORK_DIR="$ORCH_DIR/work"
BUILD_DIR="$WORK_DIR/builds"
mkdir -p "$BUILD_DIR"
log() { echo "[BUILDER $(date +%H:%M:%S)] $1"; }
build_project() {
    local project_dir="$1"
    local build_log="$BUILD_DIR/$(basename "$project_dir")_$(date +%s).log"
    log "Building: $project_dir"
    cd "$project_dir"
    if [[ -f "package.json" ]]; then
        npm install &> "$build_log" && npm run build &>> "$build_log" || true
    fi
    log "✓ Build log: $build_log"
}
log "Builder worker started"
while true; do
    for task_file in "$QUEUE_DIR/build_"*.task; do
        [[ -f "$task_file" ]] || continue
        project_dir=$(cat "$task_file")
        [[ -d "$project_dir" ]] && build_project "$project_dir"
        rm "$task_file"
    done
    for task_file in "$QUEUE_DIR/test_"*.task; do
        [[ -f "$task_file" ]] || continue
        rm "$task_file"
    done
    sleep 3
done
