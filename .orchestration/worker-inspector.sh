#!/bin/bash
# Worker: File Inspector
# Continuously inspects codebase and reports findings

set -euo pipefail

ORCH_DIR="/mnt/f/.orchestration"
QUEUE_DIR="$ORCH_DIR/queue"
WORK_DIR="$ORCH_DIR/work"
RESULTS_DIR="$WORK_DIR/inspection-results"

mkdir -p "$RESULTS_DIR"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[INSPECTOR $(date +%H:%M:%S)]${NC} $1"
}

inspect_directory() {
    local dir="$1"
    local output_file="$RESULTS_DIR/$(basename "$dir")_$(date +%s).json"
    
    log "Inspecting: $dir"
    
    # Gather comprehensive file info
    (
        echo "{"
        echo "  \"directory\": \"$dir\","
        echo "  \"timestamp\": \"$(date -Iseconds)\","
        echo "  \"files\": ["
        
        local first=true
        find "$dir" -type f -not -path '*/\.*' 2>/dev/null | while read -r file; do
            [[ $first == true ]] && first=false || echo ","
            
            local size=$(stat -c%s "$file" 2>/dev/null || echo 0)
            local lines=$(wc -l < "$file" 2>/dev/null || echo 0)
            local ext="${file##*.}"
            
            echo "    {"
            echo "      \"path\": \"$file\","
            echo "      \"size\": $size,"
            echo "      \"lines\": $lines,"
            echo "      \"extension\": \"$ext\""
            echo -n "    }"
        done
        
        echo ""
        echo "  ],"
        echo "  \"stats\": {"
        echo "    \"total_files\": $(find "$dir" -type f -not -path '*/\.*' 2>/dev/null | wc -l),"
        echo "    \"total_dirs\": $(find "$dir" -type d -not -path '*/\.*' 2>/dev/null | wc -l)"
        echo "  }"
        echo "}"
    ) > "$output_file"
    
    log "✓ Inspection saved: $output_file"
}

analyze_codebase() {
    local dir="$1"
    local output_file="$RESULTS_DIR/analysis_$(date +%s).txt"
    
    log "Analyzing codebase: $dir"
    
    {
        echo "=== CODEBASE ANALYSIS ==="
        echo "Generated: $(date)"
        echo ""
        
        echo "=== Language Distribution ==="
        find "$dir" -type f -not -path '*/\.*' 2>/dev/null | \
            sed 's/.*\.//' | sort | uniq -c | sort -rn | head -10
        echo ""
        
        echo "=== Largest Files ==="
        find "$dir" -type f -not -path '*/\.*' -exec ls -lh {} \; 2>/dev/null | \
            awk '{print $5 "\t" $9}' | sort -rh | head -10
        echo ""
        
        echo "=== Recent Changes ==="
        find "$dir" -type f -not -path '*/\.*' -mtime -1 2>/dev/null | head -20
        echo ""
        
    } > "$output_file"
    
    log "✓ Analysis saved: $output_file"
}

# Main worker loop
log "Inspector worker started"

while true; do
    # Check for inspection tasks in queue
    if task_data=$(cat "$QUEUE_DIR/inspect_"*.task 2>/dev/null | head -1); then
        rm "$QUEUE_DIR/inspect_"*.task 2>/dev/null || true
        
        if [[ -d "$task_data" ]]; then
            inspect_directory "$task_data"
            analyze_codebase "$task_data"
        fi
    fi
    
    # Auto-inspect known directories periodically
    for project in /mnt/f/bambisleep-chat /mnt/f/CATHEDRAL /mnt/f/FRINGESOCIAL; do
        if [[ -d "$project" ]]; then
            # Only inspect every 30 seconds
            last_inspection=$(find "$RESULTS_DIR" -name "$(basename $project)_*.json" -mmin -0.5 2>/dev/null | wc -l)
            if [[ $last_inspection -eq 0 ]]; then
                inspect_directory "$project"
            fi
        fi
    done
    
    sleep 5
done
