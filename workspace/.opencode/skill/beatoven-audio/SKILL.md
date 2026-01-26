---
name: beatoven-audio
description: Generate AI background music for videos using Beatoven.ai API
metadata:
  tags: audio, music, ai, beatoven, generation, background
---

## When to use

Use this skill when:
- User wants background music for a video
- User asks to "generate music" or "create a soundtrack"
- No suitable music file exists in `public/`
- User wants custom music that matches their video's mood

## Credit awareness

Beatoven.ai uses credits (currently 50 available). Each track generation costs credits.
**Always confirm with the user before generating** — suggest reusing existing tracks when appropriate.

## Setup (First Time)

Before generating music, check if the API token is configured:

```bash
echo "${BEATOVEN_API_TOKEN:+Token is set}"
```

If empty, guide the user through setup:

1. Ask user for their Beatoven.ai API token
2. Help them add it to their shell profile:

```bash
# Add to ~/.zshrc (or ~/.bashrc)
echo 'export BEATOVEN_API_TOKEN="their-token-here"' >> ~/.zshrc
source ~/.zshrc
```

## Workflow

See [rules/generate-track.md](rules/generate-track.md) for the complete generation workflow.

## Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/tracks/compose` | POST | Start track generation |
| `/api/v1/tasks/<task_id>` | GET | Check generation status |

## Prompt Tips

Good prompts for video background music:
- Include duration: "30 seconds..."
- Include mood: "upbeat", "calm", "inspiring", "corporate"
- Include genre: "lo-fi", "ambient", "cinematic", "electronic"
- Include energy: "high energy", "relaxed", "building tension"

Examples:
- "25 seconds upbeat corporate music for a product demo"
- "60 seconds calm ambient background for an explainer video"
- "30 seconds inspiring cinematic music with building energy"
