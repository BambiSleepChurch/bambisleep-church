#!/bin/bash
# Worker: File Writer
set -euo pipefail
ORCH_DIR="/mnt/f/.orchestration"
QUEUE_DIR="$ORCH_DIR/queue"
WORK_DIR="$ORCH_DIR/work"
BACKUP_DIR="$WORK_DIR/backups"
mkdir -p "$BACKUP_DIR"
log() { echo "[WRITER $(date +%H:%M:%S)] $1"; }
write_file() {
    local filepath="$1"
    local content="$2"
    if [[ -f "$filepath" ]]; then
        cp "$filepath" "$BACKUP_DIR/$(basename "$filepath").$(date +%s).bak"
    fi
    mkdir -p "$(dirname "$filepath")"
    echo "$content" > "$filepath"
    log "✓ Written: $filepath"
}
log "Writer worker started"
while true; do
    for task_file in "$QUEUE_DIR/write_"*.task; do
        [[ -f "$task_file" ]] || continue
        IFS='|' read -r action filepath content < "$task_file"
        case "$action" in
            write) write_file "$filepath" "$content" ;;
        esac
        rm "$task_file"
    done
    sleep 2
done
