#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() { echo -e "\n${BLUE}==>${NC} $1"; }
print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_warning() { echo -e "${YELLOW}!${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }

WORKSPACE_DIR="$HOME/Documents/code/langston-videos"
SETUP_REPO_URL="https://github.com/the-langston-co/remotion-workspace-setup"

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║         Langston Videos - Asset Repair                        ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "This will fix corrupted images and audio files."
echo ""

if [[ ! -d "$WORKSPACE_DIR" ]]; then
    print_error "Workspace not found at $WORKSPACE_DIR"
    print_error "Run the full setup script instead."
    exit 1
fi

print_step "Installing Git LFS..."

if ! command -v brew &>/dev/null; then
    print_error "Homebrew not found. Run the full setup script first."
    exit 1
fi

if command -v git-lfs &>/dev/null; then
    print_success "Git LFS already installed"
else
    brew install git-lfs
    print_success "Git LFS installed"
fi

git lfs install >/dev/null 2>&1

print_step "Downloading fresh assets..."

TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

git clone --depth 1 "$SETUP_REPO_URL" setup-repo >/dev/null 2>&1 || {
    print_error "Failed to download. Check your internet connection."
    rm -rf "$TEMP_DIR"
    exit 1
}

print_step "Replacing public/ folder..."

rm -rf "$WORKSPACE_DIR/public"
cp -r setup-repo/workspace/public "$WORKSPACE_DIR/public"

rm -rf "$TEMP_DIR"

echo ""
echo -e "${GREEN}✓ Assets repaired!${NC}"
echo ""
echo "Restart Remotion Studio if it's running:"
echo -e "  ${YELLOW}pm2 restart remotion-studio${NC}"
echo ""
