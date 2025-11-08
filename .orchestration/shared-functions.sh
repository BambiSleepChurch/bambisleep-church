#!/bin/bash
# Shared functions for coordinator scripts

ORCH_DIR="/mnt/f/.orchestration"
QUEUE_DIR="$ORCH_DIR/queue"
SIGNAL_DIR="$ORCH_DIR/signals"

mkdir -p "$SIGNAL_DIR" "$QUEUE_DIR"

coord_log() {
    echo "[$(date +%H:%M:%S)] $1"
}

enqueue_task() {
    local task_type="$1"
    local task_data="$2"
    local task_id="$(date +%s%N)"
    echo "$task_data" > "$QUEUE_DIR/${task_type}_${task_id}.task"
}

enqueue_write() {
    local filepath="$1"
    local content="$2"
    echo "write|$filepath|$content" > "$QUEUE_DIR/write_$(date +%s%N).task"
}

signal_ready() {
    local terminal_id="$1"
    touch "$SIGNAL_DIR/${terminal_id}_ready"
}

signal_complete() {
    local terminal_id="$1"
    touch "$SIGNAL_DIR/${terminal_id}_complete"
}

wait_for_signal() {
    local signal_name="$1"
    while [[ ! -f "$SIGNAL_DIR/$signal_name" ]]; do
        sleep 1
    done
}

wait_for_terminals() {
    local count="$1"
    coord_log "Waiting for $count terminals to be ready..."
    
    while true; do
        local ready=$(ls "$SIGNAL_DIR"/*_ready 2>/dev/null | wc -l)
        if [[ $ready -ge $count ]]; then
            break
        fi
        sleep 1
    done
    
    coord_log "✓ All terminals ready!"
}
