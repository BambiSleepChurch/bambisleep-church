# HestiaCP Node.js Nginx Templates

This repository contains Nginx templates for deploying Node.js applications with HestiaCP using different ports.

## Files Included

### Template Files (Port 3000 Example)

- `nodejs3000.sh` - Initialization script
- `nodejs3000.tpl` - HTTP configuration template
- `nodejs3000.stpl` - HTTPS (SSL) configuration template

### Automation Script

- `create-nodejs-templates.sh` - Automatic template generator for multiple ports

## Installation

### Manual Installation (Port 3000 Only)

1. Copy the template files to HestiaCP templates directory:

```bash
cp nodejs3000.sh /usr/local/hestia/data/templates/web/nginx/
cp nodejs3000.tpl /usr/local/hestia/data/templates/web/nginx/
cp nodejs3000.stpl /usr/local/hestia/data/templates/web/nginx/
```

2. Set correct permissions:

```bash
chmod 755 /usr/local/hestia/data/templates/web/nginx/nodejs3000.sh
chmod 755 /usr/local/hestia/data/templates/web/nginx/nodejs3000.tpl
chmod 755 /usr/local/hestia/data/templates/web/nginx/nodejs3000.stpl
```

### Automatic Installation (All Ports)

Run the automatic script to create templates for all ports (3000, 6969, 7878, 8787, 9696):

```bash
chmod +x create-nodejs-templates.sh
sudo ./create-nodejs-templates.sh
```

## Available Ports

The automatic script creates templates for the following ports:

- **nodejs3000** - Port 3000
- **nodejs6969** - Port 6969
- **nodejs7878** - Port 7878
- **nodejs8787** - Port 8787
- **nodejs9696** - Port 9696

## Usage

1. In HestiaCP, when creating or editing a web domain
2. Under "Nginx Template", select the desired template (e.g., `nodejs3000`)
3. Your Node.js application should be configured to listen on the corresponding port
4. The application file should be located at: `/home/USER/web/DOMAIN/nodeapp/app.js`

## How It Works

- **Nginx** acts as a reverse proxy on port 80/443
- Requests are forwarded to Node.js running on the specified port (e.g., 3000)
- **PM2** is used to manage the Node.js process
- WebSocket connections are supported via proxy upgrade headers

## Requirements

- HestiaCP installed
- Node.js installed on the server
- PM2 process manager (`npm install -g pm2`)

## Template Features

- HTTP to HTTPS redirect
- SSL/TLS support
- WebSocket support
- Gzip compression
- Error page handling
- Security headers (blocks .ht, .git, .svn, etc.)
- Custom configuration includes

## Notes

- The script automatically creates the `nodeapp` directory
- PM2 manages the Node.js application lifecycle
- Socket file permissions are set to 777 for compatibility
- Each port template is independent and can be used simultaneously on different domains

## Troubleshooting

If the template doesn't appear in HestiaCP:

1. Verify file permissions are set to 755
2. Check that files are in the correct directory
3. Restart HestiaCP: `systemctl restart hestia`
4. Check error logs: `/var/log/nginx/domains/DOMAIN.error.log`

## License

Free to use and modify for your HestiaCP installations.
