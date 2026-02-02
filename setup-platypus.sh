#!/bin/bash
set -e

echo "Starting Langston Videos Setup..."

# Platypus-ready setup script for Langston Videos
# Bundled workspace files are expected at: $APP_BUNDLE/Contents/Resources/workspace/

# Ensure Homebrew paths are available (Platypus runs with minimal PATH)
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

echo "PATH configured"

WORKSPACE_DIR="$HOME/Documents/code/langston-videos"

# Detect if running from Platypus app bundle
if [[ -d "$PWD/Contents/Resources/workspace" ]]; then
    BUNDLE_WORKSPACE="$PWD/Contents/Resources/workspace"
elif [[ -d "${0%/*}/../Resources/workspace" ]]; then
    BUNDLE_WORKSPACE="${0%/*}/../Resources/workspace"
else
    BUNDLE_WORKSPACE=""
fi

show_dialog() {
    osascript -e "display dialog \"$1\" with title \"Langston Videos Setup\" buttons {\"OK\"} default button \"OK\""
}

show_error() {
    osascript -e "display dialog \"$1\" with title \"Langston Videos Setup\" buttons {\"OK\"} default button \"OK\" with icon stop"
    exit 1
}

prompt_secure() {
    local prompt="$1"
    osascript -e "display dialog \"$prompt\" with title \"Langston Videos Setup\" default answer \"\" with hidden answer buttons {\"OK\"} default button \"OK\"" -e "text returned of result"
}

prompt_choice() {
    local message="$1"
    osascript -e "display dialog \"$message\" with title \"Langston Videos Setup\" buttons {\"Cancel\", \"Continue\"} default button \"Continue\"" 2>/dev/null
    return $?
}

echo "PROGRESS:0"
echo "Starting Langston Videos setup..."

# Step 1: Check macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    show_error "This installer is for macOS only."
fi

echo "PROGRESS:10"
echo "Checking system requirements..."

# Step 2: Check/install Xcode CLI Tools (for git)
if ! xcode-select -p &>/dev/null; then
    echo "Installing Xcode Command Line Tools..."
    show_dialog "Xcode Command Line Tools are required. Click OK, then click 'Install' in the popup that appears. This may take 5-10 minutes."
    xcode-select --install
    
    until xcode-select -p &>/dev/null; do
        sleep 5
    done
fi

echo "PROGRESS:20"
echo "Checking for nvm..."

# Step 3: Check/install nvm
export NVM_DIR="$HOME/.nvm"
if [[ ! -d "$NVM_DIR" ]]; then
    echo "Installing nvm..."
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
fi

[[ -s "$NVM_DIR/nvm.sh" ]] && source "$NVM_DIR/nvm.sh"

echo "PROGRESS:30"
echo "Installing Node.js 24..."

# Step 4: Install correct Node version via nvm
nvm install 24 --silent || nvm install 24
nvm use 24

echo "PROGRESS:40"
echo "Checking for pm2..."

# Step 5: Check/install pm2 (via Homebrew, Node-version independent)
if ! command -v pm2 &>/dev/null; then
    echo "Installing pm2..."
    brew install pm2
fi

echo "PROGRESS:50"
echo "Checking for OpenCode Desktop..."

# Step 6: Check for OpenCode Desktop
if [[ ! -d "/Applications/OpenCode.app" ]]; then
    if command -v brew &>/dev/null; then
        echo "Installing OpenCode Desktop..."
        brew install --cask opencode-desktop
    else
        show_error "OpenCode Desktop is required but not installed. Please install it from the OpenCode website and run this installer again."
    fi
fi

echo "PROGRESS:55"
echo "Setting up workspace..."

# Step 7: Create workspace (don't overwrite existing work)
mkdir -p "$HOME/Documents/code"

if [[ -d "$WORKSPACE_DIR" ]]; then
    if [[ -f "$WORKSPACE_DIR/package.json" ]]; then
        echo "Existing workspace found - preserving your work"
        WORKSPACE_EXISTS=true
    else
        WORKSPACE_EXISTS=false
    fi
else
    WORKSPACE_EXISTS=false
    mkdir -p "$WORKSPACE_DIR"
fi

if [[ "$WORKSPACE_EXISTS" == false ]]; then
    if [[ -n "$BUNDLE_WORKSPACE" && -d "$BUNDLE_WORKSPACE" ]]; then
        cp -R "$BUNDLE_WORKSPACE/." "$WORKSPACE_DIR/"
    else
        show_error "Workspace template not found in app bundle. Please re-download the installer."
    fi
fi

echo "PROGRESS:70"
echo "Installing dependencies..."

# Step 8: npm install (if needed)
cd "$WORKSPACE_DIR"
if [[ ! -d "node_modules" ]]; then
    npm install --silent
fi

echo "PROGRESS:90"
echo "Setting up version control..."

# Step 9: Git init for local version control
cd "$WORKSPACE_DIR"

if [[ ! -d ".git" ]]; then
    git init --quiet
    git add -A
    git commit -m "Initial workspace setup" --quiet
fi

if [[ -z "$(git config user.email)" ]]; then
    git config user.email "video-creator@langston.co"
    git config user.name "Langston Video Creator"
fi

echo "PROGRESS:95"
echo "Starting dev server..."

# Step 10: Start dev server with pm2
cd "$WORKSPACE_DIR"
if pm2 list 2>/dev/null | grep -q "remotion-studio"; then
    echo "Dev server already running"
else
    pm2 start npm --name "remotion-studio" -- run dev
    pm2 save --force 2>/dev/null || true
fi

echo "PROGRESS:100"
echo "Setup complete!"

# Step 11: Open everything and show instructions
open "$WORKSPACE_DIR"
open -a "OpenCode"

osascript -e 'display dialog "Setup complete!

Next steps:
1. In OpenCode, click \"Open Folder\"
2. Navigate to: Documents → code → langston-videos
3. Start creating! Try asking:
   \"Create a 5-second video that says Hello World\"

Your preview will be at http://localhost:3000" with title "Langston Videos Setup" buttons {"Get Started!"} default button "Get Started!"'
