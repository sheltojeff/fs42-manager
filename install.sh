#!/bin/bash

echo "=================================="
echo "FieldStation42 Manager Installer"
echo "=================================="

# Detect FieldStation42 installation
if [ -d "$HOME/FieldStation42" ]; then
    FS42_PATH="$HOME/FieldStation42"
elif [ -d "/opt/FieldStation42" ]; then
    FS42_PATH="/opt/FieldStation42"
else
    echo "FieldStation42 not found. Please install it first."
    exit 1
fi

echo "Found FieldStation42 at: $FS42_PATH"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Installing..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "Node.js $(node --version) found"

# Install dependencies
echo "Installing dependencies..."
npm install

# Create .env file
echo "Creating environment file..."
cat > .env << EOF
FS42_PATH=$FS42_PATH
PORT=8080
NODE_ENV=production
EOF

echo "Environment file created: .env"

echo "=================================="
echo "Installation Complete!"
echo "=================================="
echo ""
echo "To start the manager:"
echo "  npm start"
echo ""
echo "The web interface will be available at:"
echo "  http://$(hostname -I | awk '{print $1}'):8080"
echo "  or"
echo "  http://localhost:8080"
echo ""
echo "Optional: Set up as a system service"
echo "Run: sudo ./install-service.sh"
