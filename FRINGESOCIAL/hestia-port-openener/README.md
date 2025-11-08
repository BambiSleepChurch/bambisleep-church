# HestiaCP Port Opener

Automated nginx reverse proxy template generator for Node.js apps in HestiaCP with PM2 process management.

## Quick Start

```bash
# 1. Edit config.json (enable sites you want)
nano config.json

# 2. Run script
sudo ./hestia-port-opener.sh

# 3. In HestiaCP panel: WEB → Domain → Edit → Proxy Template → "nodejs[PORT]" → Save

# 4. Deploy your app to: /home/[user]/web/[domain]/nodeapp/app.js
```

## Usage

```bash
sudo ./hestia-port-opener.sh              # Use config.json
sudo ./hestia-port-opener.sh 3000         # Single port
sudo ./hestia-port-opener.sh --config my.json  # Custom config
```

## Config Format (v3.0)

```json
{
  "config": { "version": "3.0" },
  "sites": [
    {
      "name": "My App",
      "domain": "app.example.com",
      "port": 3000,
      "enabled": true,
      "url": "https://app.example.com",
      "repo": "https://github.com/user/app.git",
      "description": "Optional notes"
    }
  ]
}
```

**Required fields**: `name`, `domain`, `port`, `enabled`  
**Port range**: 1024-65535

## What It Does

1. Parses `config.json` for enabled sites
2. Validates port numbers
3. Generates 3 nginx template files per port:
   - `nodejs[PORT].sh` - PM2 initialization
   - `nodejs[PORT].tpl` - HTTP proxy config
   - `nodejs[PORT].stpl` - HTTPS proxy config
4. Installs to `/usr/local/hestia/data/templates/web/nginx/`
5. Auto-installs dependencies (jq, npm, pm2)

## App Requirements

Your Node.js app must:

- Listen on `127.0.0.1:[PORT]` (NOT `0.0.0.0`)
- Be located at `/home/[user]/web/[domain]/nodeapp/app.js`

Example:

```javascript
const express = require("express");
const app = express();
app.get("/", (req, res) => res.send("Hello!"));
app.listen(3000, "127.0.0.1");
```

## PM2 Management

```bash
pm2 list              # Show all apps
pm2 logs <name>       # View logs
pm2 restart <name>    # Restart app
```

## SSL (HestiaCP)

After applying template:

- WEB → Domain → Edit → SSL Support → Enable
- Select "Let's Encrypt" → Save
- Automatic HTTPS redirect included

## License

MIT
