# Deployment Guide

## Running on Linux Server

### First Time Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Witrotype3/train-hub.git
   cd train-hub/server
   ```

### Updating Existing Deployment

If the repository already exists, pull the latest changes:

```bash
cd ~/train-hub
git pull origin master
cd server
```

### Building and Running

1. **Navigate to the server directory:**
   ```bash
   cd train-hub/server
   ```

2. **Build the application:**
   ```bash
   go build .
   ```
   This will create a binary named `train-hub` (not `train-hub.exe` - that's Windows only)

3. **Make it executable (if needed):**
   ```bash
   chmod +x train-hub
   ```

4. **Run the server:**
   ```bash
   ./train-hub
   ```
   
   Or run directly without building:
   ```bash
   go run .
   ```

### Running in the Background

To run the server in the background and keep it running after you disconnect:

1. **Using nohup:**
   ```bash
   nohup ./train-hub > server.log 2>&1 &
   ```
   
   To stop it later:
   ```bash
   pkill -f train-hub
   ```

2. **Using screen:**
   ```bash
   screen -S train-hub
   ./train-hub
   # Press Ctrl+A then D to detach
   # Reattach with: screen -r train-hub
   ```

3. **Using systemd (for production):**
   Create `/etc/systemd/system/train-hub.service`:
   ```ini
   [Unit]
   Description=Train Hub Server
   After=network.target

   [Service]
   Type=simple
   User=almap
   WorkingDirectory=/home/almap/train-hub/server
   ExecStart=/home/almap/train-hub/server/train-hub
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```
   
   Then:
   ```bash
   sudo systemctl enable train-hub
   sudo systemctl start train-hub
   sudo systemctl status train-hub
   ```

### Troubleshooting

- **"Permission denied"**: Run `chmod +x train-hub` to make it executable
- **"go: no go files listed"**: Make sure you're using `go run .` (with the dot) not just `go run`
- **Port already in use**: Kill the process using port 443:
  ```bash
  lsof -ti:443 | xargs kill -9
  ```
- **Repository already exists**: Use `git pull` instead of `git clone`:
  ```bash
  cd ~/train-hub
  git pull origin master
  ```

### Accessing the Application

Once running, access it at:
- `http://localhost:443` (local)
- `https://buildingforward.227family.org` (production)

The server runs on port 443 by default (configurable via PORT environment variable).

Make sure port 443 is open in your firewall:
```bash
sudo ufw allow 443
```

### Production Setup with Reverse Proxy

If you're using a reverse proxy (nginx, Apache, etc.) to serve on `https://buildingforward.227family.org`, configure it to proxy to `http://localhost:443`.

Example nginx configuration:
```nginx
server {
    listen 80;
    server_name buildingforward.227family.org;
    
    location / {
        proxy_pass http://localhost:443;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Quick Update Workflow

When you push new changes and want to update the server:

```bash
cd ~/train-hub
git pull origin master
cd server
go build .
pkill -f train-hub  # Stop old instance
nohup ./train-hub > server.log 2>&1 &  # Start new instance
```
