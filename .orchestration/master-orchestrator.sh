#!/bin/bash
# Master Orchestrator - Concurrent Workflow Manager
# Usage: ./master-orchestrator.sh [command]

set -euo pipefail

ORCH_DIR="/mnt/f/.orchestration"
WORK_DIR="/mnt/f/.orchestration/work"
LOG_DIR="/mnt/f/.orchestration/logs"
PID_DIR="/mnt/f/.orchestration/pids"
QUEUE_DIR="/mnt/f/.orchestration/queue"

# Setup directories
mkdir -p "$WORK_DIR" "$LOG_DIR" "$PID_DIR" "$QUEUE_DIR"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log() {
    echo -e "${CYAN}[MASTER $(date +%H:%M:%S)]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[MASTER $(date +%H:%M:%S)]${NC} ✓ $1"
}

log_error() {
    echo -e "${RED}[MASTER $(date +%H:%M:%S)]${NC} ✗ $1"
}

log_warning() {
    echo -e "${YELLOW}[MASTER $(date +%H:%M:%S)]${NC} ⚠ $1"
}

# Task queue management
enqueue_task() {
    local task_type="$1"
    local task_data="$2"
    local task_id="$(date +%s%N)"
    local task_file="$QUEUE_DIR/${task_type}_${task_id}.task"
    
    echo "$task_data" > "$task_file"
    log "Enqueued task: ${task_type} (ID: ${task_id})"
    echo "$task_id"
}

dequeue_task() {
    local task_type="$1"
    local task_file=$(ls "$QUEUE_DIR/${task_type}_"*.task 2>/dev/null | head -1)
    
    if [[ -n "$task_file" ]]; then
        cat "$task_file"
        rm "$task_file"
        return 0
    fi
    return 1
}

# Background job management
start_worker() {
    local worker_name="$1"
    local worker_script="$2"
    local log_file="$LOG_DIR/${worker_name}.log"
    local pid_file="$PID_DIR/${worker_name}.pid"
    
    if [[ -f "$pid_file" ]] && kill -0 $(cat "$pid_file") 2>/dev/null; then
        log_warning "Worker $worker_name already running (PID: $(cat $pid_file))"
        return 0
    fi
    
    log "Starting worker: $worker_name"
    nohup bash "$worker_script" > "$log_file" 2>&1 &
    echo $! > "$pid_file"
    log_success "Worker $worker_name started (PID: $!)"
}

stop_worker() {
    local worker_name="$1"
    local pid_file="$PID_DIR/${worker_name}.pid"
    
    if [[ -f "$pid_file" ]]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
            log_success "Worker $worker_name stopped (PID: $pid)"
        fi
        rm "$pid_file"
    fi
}

stop_all_workers() {
    log "Stopping all workers..."
    for pid_file in "$PID_DIR"/*.pid; do
        [[ -f "$pid_file" ]] || continue
        local worker=$(basename "$pid_file" .pid)
        stop_worker "$worker"
    done
}

status_workers() {
    log "Worker Status:"
    echo ""
    local active=0
    
    for pid_file in "$PID_DIR"/*.pid; do
        [[ -f "$pid_file" ]] || continue
        local worker=$(basename "$pid_file" .pid)
        local pid=$(cat "$pid_file")
        
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "  ${GREEN}●${NC} $worker (PID: $pid)"
            ((active++))
        else
            echo -e "  ${RED}●${NC} $worker (dead)"
            rm "$pid_file"
        fi
    done
    
    if [[ $active -eq 0 ]]; then
        echo -e "  ${YELLOW}No active workers${NC}"
    fi
    echo ""
}

# Parallel task execution
run_parallel() {
    local task_list=("$@")
    local pids=()
    
    log "Running ${#task_list[@]} tasks in parallel..."
    
    for task in "${task_list[@]}"; do
        eval "$task" &
        pids+=($!)
    done
    
    # Wait for all tasks
    local failed=0
    for pid in "${pids[@]}"; do
        if ! wait "$pid"; then
            ((failed++))
        fi
    done
    
    if [[ $failed -eq 0 ]]; then
        log_success "All parallel tasks completed successfully"
        return 0
    else
        log_error "$failed parallel tasks failed"
        return 1
    fi
}

# Dashboard
show_dashboard() {
    clear
    echo -e "${MAGENTA}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${MAGENTA}║         COPILOT CLI ORCHESTRATION DASHBOARD               ║${NC}"
    echo -e "${MAGENTA}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    status_workers
    
    echo -e "${CYAN}Task Queue:${NC}"
    local queue_count=$(ls "$QUEUE_DIR"/*.task 2>/dev/null | wc -l)
    echo -e "  Pending tasks: $queue_count"
    echo ""
    
    echo -e "${CYAN}Recent Logs:${NC}"
    for log_file in "$LOG_DIR"/*.log; do
        [[ -f "$log_file" ]] || continue
        local worker=$(basename "$log_file" .log)
        echo -e "  ${BLUE}$worker:${NC} $(tail -1 "$log_file" 2>/dev/null || echo 'No logs')"
    done
    echo ""
}

# Main command dispatcher
case "${1:-help}" in
    start)
        log "Starting orchestration system..."
        start_worker "inspector" "$ORCH_DIR/worker-inspector.sh"
        start_worker "writer" "$ORCH_DIR/worker-writer.sh"
        start_worker "builder" "$ORCH_DIR/worker-builder.sh"
        log_success "Orchestration system started"
        ;;
    
    stop)
        stop_all_workers
        log_success "Orchestration system stopped"
        ;;
    
    restart)
        stop_all_workers
        sleep 1
        "$0" start
        ;;
    
    status)
        show_dashboard
        ;;
    
    watch)
        while true; do
            show_dashboard
            sleep 2
        done
        ;;
    
    parallel)
        shift
        run_parallel "$@"
        ;;
    
    enqueue)
        enqueue_task "$2" "$3"
        ;;
    
    clean)
        log "Cleaning work directory..."
        rm -rf "$WORK_DIR"/* "$LOG_DIR"/* "$QUEUE_DIR"/*
        log_success "Cleaned"
        ;;
    
    *)
        echo "Copilot CLI Master Orchestrator"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  start      - Start all workers"
        echo "  stop       - Stop all workers"
        echo "  restart    - Restart all workers"
        echo "  status     - Show worker status"
        echo "  watch      - Live dashboard"
        echo "  parallel   - Run tasks in parallel"
        echo "  enqueue    - Add task to queue"
        echo "  clean      - Clean work directories"
        ;;
esac
