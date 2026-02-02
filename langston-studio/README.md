# Langston Studio

A Tauri desktop app that provides a split-screen interface with OpenCode (left) and Remotion preview (right) for the "Langston Videos" vibe coding platform.

## Features

- Split-screen layout with resizable divider
- Automatic workspace setup on first launch (copies template, runs npm install, initializes git)
- Embedded OpenCode web interface for AI-assisted coding
- Embedded Remotion Studio for video preview
- No browser tabs opened - everything stays in the app

## Prerequisites

- macOS 10.15+
- [Rust](https://rustup.rs/) installed
- Node.js 18+ installed
- OpenCode CLI installed (`curl -fsSL https://opencode.ai/install | bash`)

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run build
```

## Building for Distribution

### 1. Build the app

```bash
source "$HOME/.cargo/env"
npm run build
```

This creates:
- `.app` bundle at `src-tauri/target/release/bundle/macos/Langston Studio.app`
- DMG build may fail (known issue with Tauri's bundler)

### 2. Create DMG manually (if needed)

```bash
cd src-tauri/target/release/bundle
hdiutil create -volname "Langston Studio" \
  -srcfolder "macos/Langston Studio.app" \
  -ov -format UDZO "Langston Studio.dmg"
```

### 3. Deploy to Kandji (MDM)

1. Go to Kandji > Library > Add New > Custom App
2. Select **"Disk Image"** as the installer type
3. Upload the DMG: `src-tauri/target/release/bundle/Langston Studio.dmg`
4. Set install location to `/Applications`
5. Assign to appropriate blueprint

## Architecture

```
langston-studio/
├── dist/                    # Frontend (HTML/JS served by Tauri)
│   └── index.html          # Split-screen UI with iframes
├── resources/
│   └── workspace-template/ # Bundled Remotion project template
├── src-tauri/
│   ├── src/lib.rs         # Rust backend (workspace setup, process spawning)
│   └── tauri.conf.json    # Tauri configuration
└── package.json
```

## How It Works

1. **On launch**: Checks if `~/Documents/code/langston-videos/` exists
2. **First run**: Copies workspace template, runs `npm install`, initializes git
3. **Starts servers**:
   - OpenCode: `opencode serve --port 3001` (headless, no browser)
   - Remotion: `npm run dev` on port 3000 (configured not to open browser)
4. **Displays**: Two iframes loading localhost:3001 (OpenCode) and localhost:3000 (Remotion)

## Configuration

### Preventing browser tabs from opening

- **Remotion**: `remotion.config.ts` includes `Config.setShouldOpenBrowser(false)`
- **OpenCode**: Uses `serve` command instead of `web` (serve doesn't open browser)

### Tauri settings

- `withGlobalTauri: true` - Exposes Tauri API globally for the frontend
- CSP allows `frame-src http://localhost:*` for iframe embedding

## Troubleshooting

### DMG build fails
Use the manual hdiutil command above. The Tauri bundler has intermittent issues.

### Iframes show blank/error
Check that both servers started correctly:
```bash
lsof -i :3000  # Remotion
lsof -i :3001  # OpenCode
```

### Process cleanup
```bash
pkill -f "Langston Studio"
pkill -f "opencode"
lsof -ti:3001 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

### Fresh install test
```bash
rm -rf ~/Documents/code/langston-videos
open "src-tauri/target/release/bundle/macos/Langston Studio.app"
```
