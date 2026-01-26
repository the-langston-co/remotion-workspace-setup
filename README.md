# Langston Videos - Workspace Setup

This repository contains everything needed to set up a new team member's computer for creating Remotion videos with OpenCode.

## One-Line Setup

Open **Terminal** (search for "Terminal" in Spotlight) and paste this command:

```bash
curl -fsSL https://raw.githubusercontent.com/the-langston-co/remotion-workspace-setup/main/setup.sh | bash
```

Then press **Enter** and follow the prompts.

## What Gets Installed

| Tool | Purpose |
|------|---------|
| Xcode Command Line Tools | Developer tools (includes git) |
| Homebrew | Package manager for macOS |
| Node.js | JavaScript runtime (required for Remotion) |
| OpenCode Desktop | AI coding assistant |

## What Gets Created

```
~/Documents/code/langston-videos/
├── AGENTS.md                    # Instructions for the AI
├── opencode.jsonc               # Project settings
├── .opencode/skill/             # Remotion knowledge base
│   └── remotion-best-practices/
│       ├── SKILL.md
│       └── rules/               # 30+ guides for video creation
└── my-video/                    # Your first Remotion project
    ├── src/                     # Video code goes here
    └── public/                  # Images, audio, fonts
```

## After Setup

1. **Open OpenCode Desktop** (it's in your Applications folder)
2. Click **"Open Folder"** and navigate to:
   ```
   Documents → code → langston-videos
   ```
3. **Enter the API key** when prompted (Neil will provide this)
4. Start creating! Try asking:
   > "Create a simple 5-second intro video with the text 'Hello World'"

## Previewing Your Video

Ask OpenCode: *"Start the Remotion preview server"*

This opens a browser where you can see your video and scrub through the timeline.

## Rendering Your Video

Ask OpenCode: *"Render the video as an MP4"*

The file will be saved in `my-video/out/`.

## Troubleshooting

### "Command not found" errors
Close Terminal and open a new window, then try again.

### Xcode installation popup doesn't appear
Run this in Terminal:
```bash
xcode-select --install
```

### OpenCode can't find the project
Make sure you opened the `langston-videos` folder, not `my-video` or `Documents`.

### Need help?
Ask Neil or describe your issue to the AI assistant - it can often diagnose problems.

---

## For Maintainers

### Updating the setup script
1. Edit `setup.sh`
2. Test on a fresh macOS install (or VM)
3. Push to main branch

### Updating Remotion skills
The skills in `workspace/.opencode/skill/remotion-best-practices/` come from the official Remotion documentation. To update:
1. Check for new Remotion features
2. Add/update rule files in `rules/`
3. Update `SKILL.md` to reference new rules

### Testing
```bash
# Test the setup script locally
./setup.sh

# Or simulate a fresh install
WORKSPACE_DIR="/tmp/test-langston-videos" ./setup.sh
```
