#!/bin/bash

if [ "$EUID" -ne 0 ]; then
  echo "Please run with sudo"
  exit 1
fi

INSTALL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_USER="$SUDO_USER"

echo "Installing FieldStation42 Manager as a system service..."
echo "Installation directory: $INSTALL_DIR"
echo "Service will run as user: $SERVICE_USER"

# Create systemd service file
cat > /etc/systemd/system/fs42-manager.service << EOF
[Unit]
Description=FieldStation42 Manager Web Interface
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$INSTALL_DIR
Environment="NODE_ENV=production"
EnvironmentFile=$INSTALL_DIR/.env
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
echo "Reloading systemd..."
systemctl daemon-reload

# Enable and start service
echo "Enabling service..."
systemctl enable fs42-manager

echo "Starting service..."
systemctl start fs42-manager

echo ""
echo "Service installed successfully!"
echo ""
echo "Service commands:"
echo "  sudo systemctl status fs42-manager   # Check status"
echo "  sudo systemctl stop fs42-manager     # Stop service"
echo "  sudo systemctl start fs42-manager    # Start service"
echo "  sudo systemctl restart fs42-manager  # Restart service"
echo "  sudo journalctl -u fs42-manager -f   # View logs"
