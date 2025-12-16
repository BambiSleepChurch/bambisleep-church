#!/bin/bash

# Automatic Nginx Template Generator for Node.js Applications
# This script creates Nginx templates for multiple ports

TEMPLATE_DIR="/usr/local/hestia/data/templates/web/nginx"
PORTS=(3000 6969 7878 8787 9696)

echo "Creating Nginx templates for Node.js applications..."
echo "=================================================="

for PORT in "${PORTS[@]}"; do
    echo ""
    echo "Creating templates for port $PORT..."
    
    # Create .sh file
    cat > "$TEMPLATE_DIR/nodejs${PORT}.sh" << 'EOF'
#!/bin/bash
user=$1
domain=$2
ip=$3
home=$4
docroot=$5

mkdir "$home/$user/web/$domain/nodeapp"
chown -R $user:$user "$home/$user/web/$domain/nodeapp"
runuser -l $user -c "pm2 start $home/$user/web/$domain/nodeapp/app.js"
EOF
    
    # Create .tpl file
    cat > "$TEMPLATE_DIR/nodejs${PORT}.tpl" << EOF
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
        proxy_cache_bypass \$http_upgrade;
    }

    location /error/ {
        alias %home%/%user%/web/%domain%/document_errors/;
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
    
    # Create .stpl file
    cat > "$TEMPLATE_DIR/nodejs${PORT}.stpl" << EOF
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
        proxy_cache_bypass \$http_upgrade;
    }

    location /error/ {
        alias %home%/%user%/web/%domain%/document_errors/;
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
    
    # Set correct permissions
    chmod 755 "$TEMPLATE_DIR/nodejs${PORT}.sh"
    chmod 755 "$TEMPLATE_DIR/nodejs${PORT}.tpl"
    chmod 755 "$TEMPLATE_DIR/nodejs${PORT}.stpl"
    
    echo "✓ Created nodejs${PORT}.sh"
    echo "✓ Created nodejs${PORT}.tpl"
    echo "✓ Created nodejs${PORT}.stpl"
    echo "✓ Set permissions (755) for all files"
done

echo ""
echo "=================================================="
echo "All templates created successfully!"
echo ""
echo "Available templates:"
for PORT in "${PORTS[@]}"; do
    echo "  - nodejs${PORT} (proxies to port ${PORT})"
done
echo ""
echo "You can now use these templates in HestiaCP when creating web domains."
