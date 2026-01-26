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
│   │   └── Composition.tsx # Your video components
│   └── public/            # Images, audio, fonts
└── (future projects...)
```

## Common Tasks

### Starting the Preview Server
```bash
cd my-video && npm run dev
```
Then open http://localhost:3000 in a browser.

### Rendering a Video
```bash
cd my-video && npx remotion render
```

### Creating a New Video/Scene
1. Create a new component in `src/`
2. Register it in `src/Root.tsx` as a `<Composition>`

## Skills Available

The `remotion-best-practices` skill is loaded automatically. It contains detailed guides for:
- Animations and timing
- Charts and data visualization
- Text effects and typography
- Audio and video embedding
- Transitions between scenes
- And much more

**Always refer to the skill documentation** when implementing Remotion features. It contains the correct patterns and will prevent common mistakes.

## Important Rules

1. **Never use CSS animations** - they don't render correctly. Use `useCurrentFrame()` for all animations.
2. **Never use Tailwind animation classes** - same reason.
3. **Always use `interpolate()` or `spring()`** for smooth animations.
4. **Test in the preview** before rendering the final video.

## Git & Version Control

Git is set up for local version control. This lets you:
- Save checkpoints of your work
- Undo mistakes by reverting to previous versions
- Experiment safely on branches

The AI assistant can help you make commits and manage versions - just ask!

## Getting Help

- Ask the AI assistant anything about creating videos
- For Remotion-specific questions, the assistant will reference the skills documentation
- For bugs or issues, describe what you expected vs. what happened
