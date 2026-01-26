#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "\n${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}!${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# ============================================================================
# Langston Videos Workspace Setup
# ============================================================================
# This script sets up everything needed to create Remotion videos with OpenCode
# ============================================================================

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║         Langston Videos - Workspace Setup                     ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

WORKSPACE_DIR="$HOME/Documents/code/langston-videos"
SETUP_REPO_URL="https://github.com/the-langston-co/remotion-workspace-setup"

# ----------------------------------------------------------------------------
# Step 1: Check macOS
# ----------------------------------------------------------------------------
print_step "Checking system..."

if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "This script is designed for macOS. Please contact Neil for help."
    exit 1
fi
print_success "macOS detected"

# ----------------------------------------------------------------------------
# Step 2: Xcode Command Line Tools (includes git)
# ----------------------------------------------------------------------------
print_step "Checking for Xcode Command Line Tools..."

if ! xcode-select -p &>/dev/null; then
    print_warning "Xcode Command Line Tools not found. Installing..."
    echo ""
    echo "A popup will appear asking you to install. Click 'Install' and wait."
    echo "This may take 5-10 minutes."
    echo ""
    xcode-select --install
    
    # Wait for installation
    echo "Waiting for installation to complete..."
    until xcode-select -p &>/dev/null; do
        sleep 5
    done
    print_success "Xcode Command Line Tools installed"
else
    print_success "Xcode Command Line Tools already installed"
fi

# ----------------------------------------------------------------------------
# Step 3: Homebrew
# ----------------------------------------------------------------------------
print_step "Checking for Homebrew..."

if ! command -v brew &>/dev/null; then
    print_warning "Homebrew not found. Installing..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH for Apple Silicon Macs
    if [[ -f "/opt/homebrew/bin/brew" ]]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
    fi
    print_success "Homebrew installed"
else
    print_success "Homebrew already installed"
fi

# ----------------------------------------------------------------------------
# Step 4: Node.js
# ----------------------------------------------------------------------------
print_step "Checking for Node.js..."

if ! command -v node &>/dev/null; then
    print_warning "Node.js not found. Installing..."
    brew install node
    print_success "Node.js installed"
else
    NODE_VERSION=$(node --version)
    print_success "Node.js already installed ($NODE_VERSION)"
fi

# ----------------------------------------------------------------------------
# Step 5: OpenCode Desktop
# ----------------------------------------------------------------------------
print_step "Checking for OpenCode Desktop..."

if [[ -d "/Applications/OpenCode.app" ]]; then
    print_success "OpenCode Desktop already installed"
else
    print_warning "OpenCode Desktop not found. Installing..."
    brew install --cask opencode-desktop
    print_success "OpenCode Desktop installed"
fi

# ----------------------------------------------------------------------------
# Step 6: Create workspace directory
# ----------------------------------------------------------------------------
print_step "Creating workspace directory..."

mkdir -p "$HOME/Documents/code"

if [[ -d "$WORKSPACE_DIR" ]]; then
    print_warning "Workspace already exists at $WORKSPACE_DIR"
    read -p "Do you want to continue and update the config files? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
else
    mkdir -p "$WORKSPACE_DIR"
    print_success "Created $WORKSPACE_DIR"
fi

# ----------------------------------------------------------------------------
# Step 7: Download workspace template (skills, config, AGENTS.md)
# ----------------------------------------------------------------------------
print_step "Downloading workspace template..."

TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

# Clone the setup repo
git clone --depth 1 "$SETUP_REPO_URL" setup-repo 2>/dev/null || {
    print_error "Failed to download setup files. Check your internet connection."
    exit 1
}

# Copy workspace files
cp -r setup-repo/workspace/. "$WORKSPACE_DIR/"
print_success "Workspace template installed"

# Cleanup
rm -rf "$TEMP_DIR"

# ----------------------------------------------------------------------------
# Step 8: Install Remotion project dependencies
# ----------------------------------------------------------------------------
print_step "Installing Remotion project dependencies..."

cd "$WORKSPACE_DIR/my-video"

if [[ -d "node_modules" ]]; then
    print_warning "Dependencies already installed, skipping"
else
    echo "Installing packages (this may take a minute)..."
    npm install
    print_success "Remotion project ready"
fi

cd "$WORKSPACE_DIR"

# ----------------------------------------------------------------------------
# Step 9: Initialize git for version control
# ----------------------------------------------------------------------------
print_step "Setting up version control..."

cd "$WORKSPACE_DIR"

if [[ -d ".git" ]]; then
    print_success "Git already initialized"
else
    git init
    git add -A
    git commit -m "Initial setup: Langston Videos workspace"
    print_success "Git initialized with initial commit"
fi

# ----------------------------------------------------------------------------
# Step 10: Configure Anthropic API key
# ----------------------------------------------------------------------------
print_step "Configuring AI assistant..."

OPENCODE_CONFIG_DIR="$HOME/.config/opencode"
OPENCODE_CONFIG_FILE="$OPENCODE_CONFIG_DIR/opencode.jsonc"

mkdir -p "$OPENCODE_CONFIG_DIR"

if [[ -f "$OPENCODE_CONFIG_FILE" ]]; then
    if grep -q "ANTHROPIC_API_KEY" "$OPENCODE_CONFIG_FILE" 2>/dev/null; then
        print_success "Anthropic API key already configured"
    else
        print_warning "OpenCode config exists but no API key found"
        echo ""
        echo "You'll need to add your Anthropic API key in OpenCode Desktop."
        echo "Neil will provide the key - paste it when prompted in the app."
    fi
else
    # Create minimal user config
    cat > "$OPENCODE_CONFIG_FILE" << 'EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "model": "anthropic/claude-sonnet-4-20250514",
  "autoupdate": true
}
EOF
    print_success "OpenCode config created"
    echo ""
    echo "You'll need to add your Anthropic API key in OpenCode Desktop."
    echo "Neil will provide the key - paste it when prompted in the app."
fi

# ----------------------------------------------------------------------------
# Done!
# ----------------------------------------------------------------------------
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                     Setup Complete!                           ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "Your workspace is ready at:"
echo "  ${GREEN}$WORKSPACE_DIR${NC}"
echo ""
echo "Next steps:"
echo "  1. Open ${BLUE}OpenCode Desktop${NC} (it's in your Applications folder)"
echo "  2. Click 'Open Folder' and select:"
echo "     ${YELLOW}Documents → code → langston-videos${NC}"
echo "  3. When prompted for an API key, paste the one Neil gave you"
echo "  4. Start creating videos! Try typing:"
echo "     ${YELLOW}\"Create a simple 5-second intro video with the text 'Hello World'\"${NC}"
echo ""
echo "To preview your video:"
echo "  1. In OpenCode, ask: \"Start the Remotion preview server\""
echo "  2. Open the URL it shows you (usually http://localhost:3000)"
echo ""

# Open the workspace folder in Finder
open "$WORKSPACE_DIR"

# Optionally launch OpenCode Desktop
read -p "Would you like to open OpenCode Desktop now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    open -a "OpenCode"
fi
