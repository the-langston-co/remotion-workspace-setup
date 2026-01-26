# Langston Videos Workspace

You are helping create animated videos using **Remotion** - a React framework for creating videos programmatically.

## What This Workspace Is For

This workspace is for creating marketing videos, social media content, and animated presentations for Langston.

## Brand Colors

**Always use these Langston brand colors when creating videos:**

| Name | Hex | Usage |
|------|-----|-------|
| Midnight Green | `#155F6C` | Primary - headers, key elements |
| Tiffany Blue | `#73C1BD` | Secondary - accents, highlights |
| Moss Green | `#89975D` | Success states, nature themes |
| Naples Yellow | `#FFDD6F` | Attention, warnings, energy |
| Burnt Sienna | `#DD6A48` | Warmth, calls-to-action |
| Amaranth Purple | `#9D4254` | Premium, emphasis |
| Lapis Lazuli | `#365D83` | Trust, professional, links |

**Color combinations that work well:**
- Midnight Green + Tiffany Blue (professional)
- Burnt Sienna + Naples Yellow (energetic)
- Lapis Lazuli + Tiffany Blue (calm, trustworthy)
- Amaranth Purple + Naples Yellow (bold contrast)

**In code:**
```tsx
const BRAND_COLORS = {
  midnightGreen: "#155F6C",
  tiffanyBlue: "#73C1BD",
  mossGreen: "#89975D",
  naplesYellow: "#FFDD6F",
  burntSienna: "#DD6A48",
  amaranthPurple: "#9D4254",
  lapisLazuli: "#365D83",
};
```

## Session Start (DO THIS FIRST)

**At the start of every session**, before doing anything else:

1. **Check if the dev server is running:**
   ```bash
   lsof -i :3000
   ```

2. **If NOT running, start it:**
   ```bash
   npm run dev > /dev/null 2>&1 &
   sleep 3
   ```

3. **Verify it started:**
   ```bash
   lsof -i :3000
   ```

4. **Tell the user:**
   - If started: "Remotion Studio is running at http://localhost:3000 - you can open this in your browser to preview videos."
   - If already running: "Remotion Studio is already running at http://localhost:3000"
   - If failed: Check the troubleshooting section and help them fix it.

**Then** greet the user and ask what they'd like to create or work on.

## Key Concepts

- **Remotion** turns React code into videos
- Videos are made of **compositions** - each composition is a separate video
- All compositions are defined in `src/Root.tsx`
- Animations are driven by the current **frame** number
- The preview server (Remotion Studio) lets you see changes instantly

## Project Structure

```
langston-videos/
├── AGENTS.md              # This file - AI instructions
├── opencode.jsonc         # OpenCode config
├── package.json           # Project dependencies
├── remotion.config.ts     # Remotion settings
├── src/
│   ├── Root.tsx           # All compositions registered here
│   ├── HelloWorld.tsx     # Example video component
│   └── (new videos...)    # Add new video components here
├── public/                # Images, audio, fonts go here
└── .opencode/skill/       # Remotion best practices
```

## Dev Server Reference

The dev server is auto-started at session begin (see above). These commands are for manual control:

**Start:** `npm run dev`
**Stop:** `lsof -ti :3000 | xargs kill -9`
**Check if running:** `lsof -i :3000`

## Common Tasks

### Creating a New Video
1. Create a new component file in `src/` (e.g., `src/MyNewVideo.tsx`)
2. Register it in `src/Root.tsx` as a `<Composition>`
3. It will appear in Remotion Studio's sidebar

Example new video component:
```tsx
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

const BRAND = {
  midnightGreen: "#155F6C",
  tiffanyBlue: "#73C1BD",
  naplesYellow: "#FFDD6F",
};

export const MyNewVideo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const opacity = interpolate(frame, [0, fps], [0, 1], {
    extrapolateRight: "clamp",
  });
  
  const scale = spring({ frame, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${BRAND.midnightGreen} 0%, ${BRAND.tiffanyBlue} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <h1
        style={{
          opacity,
          transform: `scale(${scale})`,
          color: "white",
          fontSize: 72,
          fontWeight: 700,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        My New Video
      </h1>
    </AbsoluteFill>
  );
};
```

Register it in `src/Root.tsx`:
```tsx
<Composition
  id="MyNewVideo"
  component={MyNewVideo}
  durationInFrames={150}
  fps={30}
  width={1920}
  height={1080}
/>
```

### Rendering a Video
```bash
npx remotion render [CompositionId] out/video.mp4
```

### Rendering a Still Image
```bash
npx remotion still [CompositionId] out/thumbnail.png
```

## Skills Available

**IMPORTANT: Load the `remotion-best-practices` skill at the start of any Remotion work:**
```
/skill remotion-best-practices
```

This skill contains detailed guides for:
- Animations and timing
- Charts and data visualization  
- Text effects and typography
- Audio and video embedding
- Transitions between scenes
- And much more

**Always refer to the skill documentation** when implementing Remotion features.

## Critical Rules for Remotion Development

### Styling: ALWAYS Use Inline Styles

**Avoid Tailwind CSS classes in Remotion components** - Even when installed, Tailwind can cause import/build errors and styling issues that result in black screens or missing styles.

```tsx
// ✅ CORRECT - Always use inline styles
<div 
  style={{
    backgroundColor: "#155F6C",
    color: "white",
    fontSize: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }}
>
  Content
</div>

// ❌ WRONG - CSS classes are unreliable in Remotion
<div className="bg-blue-500 text-white text-xl flex items-center justify-center">
  Content  
</div>
```

### Animation Rules

1. **Never use CSS animations** - they don't render correctly during video export
2. **Never use Tailwind animation classes** - same reason
3. **Always use `useCurrentFrame()` + `interpolate()` or `spring()`** for all animations
4. **Test in the preview** before rendering the final video

### Development Workflow

1. **Restart the dev server** when adding new compositions to `Root.tsx` - hot-reload doesn't pick up composition changes
2. **Test styling immediately** - confirm basic styling works before building complex animations
3. **Start with inline styles from the beginning** - don't rely on CSS classes
4. **Keep `index.css` minimal** - only basic resets, avoid framework imports

## Troubleshooting

### Installation Issues

**"Module not found" or import errors:**
```bash
npm install
```

**"Command not found: npm":**
Close and reopen Terminal, or run:
```bash
source ~/.zprofile
```

**Permission errors during npm install:**
```bash
sudo chown -R $(whoami) ~/.npm
npm install
```

### Dev Server Issues

**Port 3000 already in use:**
```bash
lsof -ti :3000 | xargs kill -9
npm run dev
```

**Server won't start:**
1. Check for errors in terminal output
2. Try deleting node_modules and reinstalling:
```bash
rm -rf node_modules && npm install
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

**White/blank preview or black screen:**
- Check browser console for errors
- Verify the component is returning valid JSX
- Check that the composition is registered in Root.tsx
- **Most common cause:** CSS classes not loading - convert to inline styles immediately

**Styling not appearing (black text on black, missing colors):**
- **Convert all CSS classes to inline styles** - this is the fix
- Don't try to debug Tailwind/CSS imports - just use inline styles
- Check that background colors are set on the container

**New composition not showing in sidebar:**
- **Restart the dev server** - composition changes require a restart
- Verify the composition is properly registered in `Root.tsx`

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
