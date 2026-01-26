# Langston Videos Workspace

You are helping create animated videos using **Remotion** - a React framework for creating videos programmatically.

## What This Workspace Is For

This workspace is for creating marketing videos, social media content, and animated presentations for Langston.

## Key Concepts

- **Remotion** turns React code into videos
- Videos are made of **compositions** (like scenes)
- Animations are driven by the current **frame** number
- The preview server lets you see changes instantly

## Project Structure

```
langston-videos/
├── my-video/              # Your Remotion project
│   ├── src/
│   │   ├── Root.tsx       # Defines all compositions
│   │   └── HelloWorld.tsx # Your video components
│   └── public/            # Images, audio, fonts
└── (future projects...)
```

## Dev Server Management

**IMPORTANT:** Before making any video changes, ensure the Remotion dev server is running.

### Auto-start behavior
When the user asks to create, edit, or preview a video:
1. Check if the dev server is running (look for process on port 3000 or check `lsof -i :3000`)
2. If not running, start it automatically: `cd my-video && npm run dev &`
3. Wait a few seconds for it to start, then proceed
4. Tell the user the preview is available at http://localhost:3000

### Starting manually
```bash
cd my-video && npm run dev
```
Opens Remotion Studio at http://localhost:3000

### Stopping the server
```bash
# Find and kill the process
lsof -ti :3000 | xargs kill -9
```

## Common Tasks

### Creating a New Video/Scene
1. Create a new component in `src/`
2. Register it in `src/Root.tsx` as a `<Composition>`
3. Preview it in Remotion Studio

### Rendering a Video
```bash
cd my-video && npx remotion render [CompositionId] out/video.mp4
```

### Rendering a Still Image
```bash
cd my-video && npx remotion still [CompositionId] out/thumbnail.png
```

## Skills Available

The `remotion-best-practices` skill is loaded automatically. It contains detailed guides for:
- Animations and timing
- Charts and data visualization
- Text effects and typography
- Audio and video embedding
- Transitions between scenes
- And much more

**Always refer to the skill documentation** when implementing Remotion features.

## Important Rules

1. **Never use CSS animations** - they don't render correctly. Use `useCurrentFrame()` for all animations.
2. **Never use Tailwind animation classes** - same reason.
3. **Always use `interpolate()` or `spring()`** for smooth animations.
4. **Test in the preview** before rendering the final video.

## Troubleshooting

### Installation Issues

**"Module not found" or import errors:**
```bash
cd my-video && npm install
```

**"Command not found: npm":**
The user needs to close and reopen their terminal, or run:
```bash
source ~/.zprofile
```

**Permission errors during npm install:**
```bash
sudo chown -R $(whoami) ~/.npm
cd my-video && npm install
```

### Dev Server Issues

**Port 3000 already in use:**
```bash
# Kill whatever is using port 3000
lsof -ti :3000 | xargs kill -9
# Then restart
cd my-video && npm run dev
```

**Server won't start:**
1. Check for errors in terminal output
2. Try deleting node_modules and reinstalling:
```bash
cd my-video && rm -rf node_modules && npm install
```

### Runtime/Browser Errors

**Where to find errors:**
1. **Remotion Studio UI** - Error overlays appear directly in the preview
2. **Browser DevTools** - Press `Cmd+Option+I` in Chrome/Safari to open console
3. **Terminal** - The terminal running `npm run dev` shows compilation errors

**Common runtime errors:**

**"Cannot read property of undefined":**
- Usually means a prop wasn't passed to a component
- Check that `defaultProps` are set in the Composition definition

**"Invalid hook call":**
- Make sure hooks are only called at the top level of components
- Don't call hooks inside loops, conditions, or nested functions

**White/blank preview:**
- Check browser console for errors
- Verify the component is returning valid JSX
- Check that the composition is registered in Root.tsx

**Animation not smooth/flickering:**
- You're probably using CSS animations - switch to `useCurrentFrame()`
- Check that you're not using Tailwind animation classes

### Rendering Issues

**Render fails with memory error:**
- Try rendering at lower resolution first
- Close other applications to free up RAM

**Render is very slow:**
- This is normal for complex videos
- Consider reducing duration or complexity for testing

## Git & Version Control

Git is set up for local version control. This lets you:
- Save checkpoints of your work
- Undo mistakes by reverting to previous versions
- Experiment safely on branches

**Before making big changes**, create a checkpoint:
```bash
git add -A && git commit -m "Before: description of what you're about to try"
```

**To undo recent changes:**
```bash
git checkout -- .
```

**To see what changed:**
```bash
git status
git diff
```

The AI assistant can help you make commits and manage versions - just ask!

## Getting Help

- Ask the AI assistant anything about creating videos
- For Remotion-specific questions, the assistant will reference the skills documentation
- For bugs or issues, describe what you expected vs. what happened
- If setup issues occur, share the log file at `~/.langston-setup/` with Neil
