#!/bin/bash

################################################################################
# HestiaCP Port Opener Script
# 
# This script creates nginx proxy templates for Node.js applications running on
# custom ports in HestiaCP. It automates the process of setting up reverse proxy
# configurations for different port numbers.
#
# Usage: 
#   ./hestia-port-opener.sh                  (Use config.json)
#   ./hestia-port-opener.sh [port_number]    (Single port)
#   ./hestia-port-opener.sh --config <file>  (Custom config)
#
# Example: 
#   ./hestia-port-opener.sh                  # Uses config.json
#   ./hestia-port-opener.sh 3000             # Single port mode
#   ./hestia-port-opener.sh --config my.json # Custom config
#
# Based on: https://forum.hestiacp.com/t/nodejs-python-web-script/10196/3
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Template directory
TEMPLATE_DIR="/usr/local/hestia/data/templates/web/nginx"

# Global variables
MODE=""
JSON_FILE=""
PORTS_TO_CREATE=()

# Function to display usage
usage() {
    echo -e "${BLUE}Usage:${NC}"
    echo "  $0                              (Use config.json if exists)"
    echo "  $0 [port_number]                (Single port mode)"
    echo "  $0 --config <config.json>       (Specify config file)"
    echo ""
    echo -e "${BLUE}Examples:${NC}"
    echo "  $0                              # Use config.json from current directory"
    echo "  $0 3000                         # Create template for port 3000"
    echo "  $0 --config myconfig.json       # Use custom config file"
    echo ""
    echo -e "${BLUE}Config Format (v3.0):${NC}"
    echo '  {"config": {"version": "3.0"}, "sites": [{"name": "App", "domain": "example.com", "port": 3000, "enabled": true}]}'
    echo ""
    exit 1
}

# Function to check if jq is installed
check_jq() {
    if ! command -v jq &> /dev/null; then
        echo -e "${YELLOW}⚠${NC}  jq is not installed. Installing..."
        apt-get update && apt-get install -y jq
        echo -e "${GREEN}✓${NC} jq installed successfully"
    fi
}

# Function to validate port number
validate_port() {
    local port=$1
    if ! [[ "$port" =~ ^[0-9]+$ ]] || [ "$port" -lt 1024 ] || [ "$port" -gt 65535 ]; then
        echo -e "${RED}Error: Invalid port number '$port'. Please use a port between 1024 and 65535${NC}"
        return 1
    fi
    return 0
}

# Function to parse unified config.json
parse_config_json() {
    local file=$1
    check_jq
    
    echo -e "${BLUE}Parsing unified configuration from: $file${NC}"
    
    # Expected format: {"sites": [{"name": "...", "domain": "...", "url": "...", "port": 3000, "repo": "...", "enabled": true}, ...]}
    if ! jq empty "$file" 2>/dev/null; then
        echo -e "${RED}Error: Invalid JSON in $file${NC}"
        exit 1
    fi
    
    # Check if config has version info
    local version=$(jq -r '.config.version // "unknown"' "$file" 2>/dev/null)
    if [ "$version" != "unknown" ]; then
        echo -e "${GREEN}Config version: $version${NC}"
    fi
    
    # Extract sites that are enabled
    local sites=$(jq -r '.sites[]? | select(.enabled == true) | .port' "$file" 2>/dev/null)
    if [ -z "$sites" ]; then
        echo -e "${YELLOW}Warning: No enabled sites found in JSON file.${NC}"
        echo -e "${YELLOW}Trying all sites (ignoring enabled flag)...${NC}"
        sites=$(jq -r '.sites[]? | .port' "$file" 2>/dev/null)
    fi
    
    if [ -z "$sites" ]; then
        echo -e "${RED}Error: No sites found in JSON file.${NC}"
        echo -e "${RED}Expected format: {\"sites\": [{\"port\": 3000, \"domain\": \"...\", \"url\": \"...\", ...}]}${NC}"
        exit 1
    fi
    
    # Display site information
    echo -e "${GREEN}Found sites:${NC}"
    jq -r '.sites[]? | select(.enabled == true) | "  • \(.name) (\(.domain)) → Port \(.port)"' "$file" 2>/dev/null || \
    jq -r '.sites[]? | "  • \(.name) (\(.domain)) → Port \(.port)"' "$file" 2>/dev/null
    echo ""
    
    while IFS= read -r port; do
        if validate_port "$port"; then
            PORTS_TO_CREATE+=("$port")
        fi
    done <<< "$sites"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}Error: This script must be run as root${NC}" 
   exit 1
fi

# Parse command line arguments
if [ $# -eq 0 ]; then
    # No arguments - use config.json if exists, otherwise show usage
    if [ -f "config.json" ]; then
        echo -e "${GREEN}No arguments provided. Using config.json${NC}"
        MODE="config"
        JSON_FILE="config.json"
        parse_config_json "$JSON_FILE"
    else
        echo -e "${RED}Error: No arguments provided and config.json not found${NC}"
        usage
    fi
elif [ $# -eq 1 ]; then
    # Single port number
    if [[ "$1" =~ ^[0-9]+$ ]]; then
        if validate_port "$1"; then
            PORTS_TO_CREATE+=("$1")
            MODE="single"
        else
            exit 1
        fi
    else
        echo -e "${RED}Error: Invalid argument${NC}"
        usage
    fi
elif [ $# -eq 2 ]; then
    # Config file mode
    if [ "$1" = "--config" ]; then
        MODE="config"
        JSON_FILE="$2"
        if [ ! -f "$JSON_FILE" ]; then
            echo -e "${RED}Error: File not found: $JSON_FILE${NC}"
            exit 1
        fi
        parse_config_json "$JSON_FILE"
    else
        echo -e "${RED}Error: Unknown option: $1${NC}"
        usage
    fi
else
    echo -e "${RED}Error: Too many arguments${NC}"
    usage
fi

# Check if we have ports to create
if [ ${#PORTS_TO_CREATE[@]} -eq 0 ]; then
    echo -e "${RED}Error: No valid ports found to create templates${NC}"
    exit 1
fi

# Remove duplicates
PORTS_TO_CREATE=($(printf "%s\n" "${PORTS_TO_CREATE[@]}" | sort -u))

echo -e "${GREEN}=== HestiaCP Port Opener ===${NC}"
echo -e "Mode: ${YELLOW}$MODE${NC}"
echo -e "Ports to create: ${YELLOW}${PORTS_TO_CREATE[@]}${NC}"
echo ""

# Function to create template for a specific port
create_port_template() {
    local PORT=$1
    local TEMPLATE_NAME="nodejs${PORT}"
    local SH_FILE="${TEMPLATE_DIR}/${TEMPLATE_NAME}.sh"
    local TPL_FILE="${TEMPLATE_DIR}/${TEMPLATE_NAME}.tpl"
    local STPL_FILE="${TEMPLATE_DIR}/${TEMPLATE_NAME}.stpl"

    echo -e "${BLUE}Creating templates for port ${PORT}...${NC}"

    # Create .sh file (initialization script)
    cat > "$SH_FILE" << 'EOF'
#!/bin/bash
user=$1
domain=$2
ip=$3
home=$4
docroot=$5

mkdir -p "$home/$user/web/$domain/nodeapp"
chown -R $user:$user "$home/$user/web/$domain/nodeapp"
rm -f "$home/$user/web/$domain/nodeapp/app.sock"
runuser -l $user -c "pm2 start $home/$user/web/$domain/nodeapp/app.js" 2>/dev/null || true
sleep 5
chmod 777 "$home/$user/web/$domain/nodeapp/app.sock" 2>/dev/null || true
EOF

    echo -e "  ${GREEN}✓${NC} Created $SH_FILE"

    # Create .tpl file (HTTP proxy configuration)
    cat > "$TPL_FILE" << EOF
server {
    listen %ip%:%proxy_port%;
    server_name %domain_idn% %alias_idn%;
    error_log /var/log/%web_system%/domains/%domain%.error.log error;

    location / {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /error/ {
        alias %home%/%user%/web/%domain%/document_errors/;
    }

    location @fallback {
        proxy_pass http://127.0.0.1:${PORT}/\$1;
    }

    location ~ /\.ht {
        return 404;
    }
    location ~ /\.svn/ {
        return 404;
    }
    location ~ /\.git/ {
        return 404;
    }
    location ~ /\.hg/ {
        return 404;
    }
    location ~ /\.bzr/ {
        return 404;
    }

    include %home%/%user%/conf/web/nginx.%domain%.conf*;
}
EOF

    echo -e "  ${GREEN}✓${NC} Created $TPL_FILE"

    # Create .stpl file (HTTPS proxy configuration)
    cat > "$STPL_FILE" << EOF
server {
    listen %ip%:%proxy_port%;
    server_name %domain_idn%;
    return 301 https://%domain_idn%\$request_uri;
}

server {
    listen %ip%:%proxy_ssl_port% http2 ssl;
    server_name %domain_idn%;
    ssl_certificate %ssl_pem%;
    ssl_certificate_key %ssl_key%;
    error_log /var/log/%web_system%/domains/%domain%.error.log error;
    
    gzip on;
    gzip_min_length 1100;
    gzip_buffers 4 32k;
    gzip_types image/svg+xml svg svgz text/plain application/x-javascript text/xml text/css;
    gzip_vary on;

    location / {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /error/ {
        alias %home%/%user%/web/%domain%/document_errors/;
    }

    location @fallback {
        proxy_pass https://127.0.0.1:${PORT}/\$1;
    }

    location ~ /\.ht {
        return 404;
    }
    location ~ /\.svn/ {
        return 404;
    }
    location ~ /\.git/ {
        return 404;
    }
    location ~ /\.hg/ {
        return 404;
    }
    location ~ /\.bzr/ {
        return 404;
    }

    include %home%/%user%/conf/web/s%proxy_system%.%domain%.conf*;
}
EOF

    echo -e "  ${GREEN}✓${NC} Created $STPL_FILE"

    # Set correct permissions
    chmod 755 "$SH_FILE" "$TPL_FILE" "$STPL_FILE"
    echo -e "  ${GREEN}✓${NC} Permissions set for port ${PORT}"
    echo ""
}

# Process each port
TOTAL_PORTS=${#PORTS_TO_CREATE[@]}
CURRENT=0

for PORT in "${PORTS_TO_CREATE[@]}"; do
    CURRENT=$((CURRENT + 1))
    echo -e "${YELLOW}[${CURRENT}/${TOTAL_PORTS}]${NC} Processing port ${PORT}..."
    create_port_template "$PORT"
done

# Check if PM2 is installed
echo -e "${YELLOW}Checking for PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠${NC}  PM2 is not installed. Installing..."
    if command -v npm &> /dev/null; then
        npm install -g pm2
        echo -e "${GREEN}✓${NC} PM2 installed successfully"
    else
        echo -e "${RED}✗${NC} npm is not installed. Installing npm..."
        apt-get update && apt-get install -y npm
        npm install -g pm2
        echo -e "${GREEN}✓${NC} npm and PM2 installed successfully"
    fi
else
    echo -e "${GREEN}✓${NC} PM2 is already installed"
fi
echo ""

echo -e "${GREEN}=== Installation Complete ===${NC}"
echo ""
echo -e "${GREEN}Successfully created templates for ${#PORTS_TO_CREATE[@]} port(s):${NC}"
for PORT in "${PORTS_TO_CREATE[@]}"; do
    echo -e "  - ${YELLOW}nodejs${PORT}${NC} (port ${PORT})"
done
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Go to your HestiaCP panel (https://your-server:8083)"
echo "2. Navigate to WEB section"
echo "3. Edit your domain"
echo "4. In 'Proxy Template' dropdown, select the template (e.g., 'nodejs3000')"
echo "5. Save the configuration"
echo "6. Place your Node.js app in: /home/[user]/web/[domain]/nodeapp/app.js"
echo "7. Make sure your app listens on the correct port"
echo ""
echo -e "${YELLOW}Example app.js:${NC}"
echo "const express = require('express');"
echo "const app = express();"
echo "app.get('/', (req, res) => res.send('Hello World!'));"
echo "app.listen(3000, '127.0.0.1');"
echo ""
echo -e "${YELLOW}Note:${NC} Your Node.js app will be automatically managed by PM2"
echo ""

