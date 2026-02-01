# FieldStation42 Manager - Standalone Edition

A simple, database-free web interface for managing your FieldStation42 TV broadcast system.

## Features

- ✅ No database required
- ✅ No authentication (designed for local network use)
- ✅ Simple installation
- ✅ Channel creation and management
- ✅ File upload (shows, commercials, bumpers)
- ✅ Catalog building
- ✅ Schedule generation
- ✅ Player control

## Requirements

- **Raspberry Pi OS Bookworm (64-bit)** - REQUIRED
- Node.js 20.x or higher
- FieldStation42 installed

## Installation

1. **Install FieldStation42 first** (if not already installed):
   ```bash
   cd ~
   git clone https://github.com/shane-mason/FieldStation42.git
   cd FieldStation42
   ./install.sh
   ```

2. **Clone this repository**:
   ```bash
   cd ~
   git clone https://github.com/sheltojeff/fs42-manager.git
   cd fs42-manager
   ```

3. **Run the installer**:
   ```bash
   chmod +x install.sh
   ./install.sh
   ```

4. **Start the manager**:
   ```bash
   npm start
   ```

5. **Optional: Install as a service**:
   ```bash
   chmod +x install-service.sh
   sudo ./install-service.sh
   ```

## Usage

Open your browser to:
- `http://YOUR_PI_IP:8080`
- or `http://localhost:8080` (from the Pi)

### Creating a Channel

1. Click "Create Channel"
2. Enter channel name and number
3. Choose channel type (Standard or Loop)
4. Enable/disable commercials
5. Click "Create Channel"

### Uploading Media

- **For a specific channel**: Click "Upload" on the channel card
- **For commercials**: Go to Media Library tab → Upload Commercials
- **For bumpers**: Go to Media Library tab → Upload Bumpers

### Building and Running

1. Upload your media files
2. Click "Build Catalog" on the channel
3. Click "Schedule (7d)" to generate a week of programming
4. Click "Start Player" to begin broadcasting

## Service Management

If installed as a service:

```bash
# Check status
sudo systemctl status fs42-manager

# Stop service
sudo systemctl stop fs42-manager

# Start service
sudo systemctl start fs42-manager

# Restart service
sudo systemctl restart fs42-manager

# View logs
sudo journalctl -u fs42-manager -f
```

## Troubleshooting

### Can't access the web interface

Check if the service is running:
```bash
sudo systemctl status fs42-manager
```

Check the logs:
```bash
sudo journalctl -u fs42-manager -n 50
```

### Port 8080 already in use

Edit `.env` file and change the PORT value:
```bash
nano .env
# Change PORT=8080 to PORT=8081 (or any other port)
```

Then restart:
```bash
sudo systemctl restart fs42-manager
```

## Architecture

This is a standalone Node.js application with:
- **Backend**: Express.js server (no database, no authentication)
- **Frontend**: Single HTML file with embedded CSS and JavaScript
- **Dependencies**: Only Express and Multer (for file uploads)

Perfect for local network use on a Raspberry Pi.

## License

MIT
