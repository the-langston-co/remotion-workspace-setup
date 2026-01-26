#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Setup logging - verbose output goes to log file, clean output to screen
LOG_DIR="$HOME/.langston-setup"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/setup-$(date +%Y%m%d-%H%M%S).log"
echo "Setup started at $(date)" > "$LOG_FILE"

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

run_quiet() {
    "$@" >> "$LOG_FILE" 2>&1
}

# ============================================================================
# Langston Videos Workspace Setup
# ============================================================================

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║         Langston Videos - Workspace Setup                     ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "This will install everything you need to create videos."
echo "It may take 5-10 minutes. Just follow the prompts!"
echo ""
echo "(Log file: $LOG_FILE)"
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
    print_warning "Node.js not found. Installing (this may take a minute)..."
    run_quiet brew install node
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
    print_warning "OpenCode Desktop not found. Installing (this may take a minute)..."
    run_quiet brew install --cask opencode-desktop
    print_success "OpenCode Desktop installed"
fi

# ----------------------------------------------------------------------------
# Step 6: Create workspace directory
# ----------------------------------------------------------------------------
print_step "Creating workspace directory..."

mkdir -p "$HOME/Documents/code"

WORKSPACE_EXISTS=false
if [[ -d "$WORKSPACE_DIR" ]]; then
    WORKSPACE_EXISTS=true
    print_warning "Workspace already exists at $WORKSPACE_DIR"
    print_success "Skipping template download to preserve your changes"
else
    mkdir -p "$WORKSPACE_DIR"
    print_success "Created $WORKSPACE_DIR"
fi

# ----------------------------------------------------------------------------
# Step 7: Download workspace template (skills, config, AGENTS.md)
# ----------------------------------------------------------------------------
if [[ "$WORKSPACE_EXISTS" == false ]]; then
    print_step "Downloading workspace template..."

    TEMP_DIR=$(mktemp -d)
    cd "$TEMP_DIR"

    run_quiet git clone --depth 1 "$SETUP_REPO_URL" setup-repo || {
        print_error "Failed to download setup files. Check your internet connection."
        print_error "Log file: $LOG_FILE"
        exit 1
    }

    cp -r setup-repo/workspace/. "$WORKSPACE_DIR/"
    print_success "Workspace template installed"

    rm -rf "$TEMP_DIR"
else
    print_step "Skipping template download (workspace exists)"
    print_success "Your existing files are preserved"
fi

# ----------------------------------------------------------------------------
# Step 8: Install Remotion project dependencies
# ----------------------------------------------------------------------------
print_step "Installing Remotion project dependencies..."

if [[ ! -d "$WORKSPACE_DIR/my-video" ]]; then
    print_warning "No my-video project found. Skipping dependency install."
    print_warning "Create a new Remotion project with: cd $WORKSPACE_DIR && npx create-video@latest my-video"
elif [[ -d "$WORKSPACE_DIR/my-video/node_modules" ]]; then
    print_success "Dependencies already installed"
else
    cd "$WORKSPACE_DIR/my-video"
    print_warning "Installing packages (this may take a minute)..."
    run_quiet npm install
    print_success "Remotion project ready"
    cd "$WORKSPACE_DIR"
fi

# ----------------------------------------------------------------------------
# Step 9: Initialize git for version control
# ----------------------------------------------------------------------------
print_step "Setting up version control..."

cd "$WORKSPACE_DIR"

if [[ -d ".git" ]]; then
    print_success "Git already initialized"
else
    run_quiet git init
    run_quiet git add -A
    run_quiet git commit -m "Initial setup: Langston Videos workspace"
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

echo "Setup completed at $(date)" >> "$LOG_FILE"

clear
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║              ${GREEN}Setup Complete!${NC}                                 ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "Everything is installed and ready to go!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "${BLUE}WHAT TO DO NEXT:${NC}"
echo ""
echo "  ${GREEN}1.${NC} Open the ${BLUE}OpenCode${NC} app"
echo "     (A Finder window just opened - you can also find it in Applications)"
echo ""
echo "  ${GREEN}2.${NC} In OpenCode, click ${YELLOW}'Open Folder'${NC} and choose:"
echo "     ${YELLOW}Documents → code → langston-videos${NC}"
echo ""
echo "  ${GREEN}3.${NC} When asked for an API key, paste the one Neil gave you"
echo ""
echo "  ${GREEN}4.${NC} Start creating! Try asking:"
echo "     ${YELLOW}\"Create a 5-second video that says Hello World\"${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "${BLUE}NEED HELP?${NC}"
echo "  • Ask Neil for help"
echo "  • Share this log file if troubleshooting: ${YELLOW}$LOG_FILE${NC}"
echo ""

open "$WORKSPACE_DIR"

read -p "Open OpenCode now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    open -a "OpenCode"
    echo ""
    echo "OpenCode is opening! Follow the steps above to get started."
fi
echo ""
