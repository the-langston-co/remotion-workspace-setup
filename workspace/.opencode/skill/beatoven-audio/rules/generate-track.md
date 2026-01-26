---
name: generate-track
description: Step-by-step workflow to generate music with Beatoven.ai
metadata:
  tags: beatoven, generate, workflow, api
---

# Generate a Track with Beatoven.ai

## Pre-flight Check

Before generating, verify the token is set:

```bash
if [ -z "$BEATOVEN_API_TOKEN" ]; then
  echo "❌ BEATOVEN_API_TOKEN not set. Ask user for their token."
else
  echo "✅ Token configured"
fi
```

If not set, help the user:
1. Ask them to provide their Beatoven.ai API token
2. Run: `echo 'export BEATOVEN_API_TOKEN="TOKEN_HERE"' >> ~/.zshrc && source ~/.zshrc`

## Step 1: Compose Request

Start the generation with a prompt. Adjust duration and mood to match the video.

```bash
RESPONSE=$(curl -s -X POST "https://public-api.beatoven.ai/api/v1/tracks/compose" \
  -H "Authorization: Bearer $BEATOVEN_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": {
      "text": "30 seconds upbeat corporate background music"
    },
    "format": "mp3",
    "looping": false
  }')

TASK_ID=$(echo $RESPONSE | grep -o '"task_id":"[^"]*"' | cut -d'"' -f4)
echo "Task started: $TASK_ID"
```

**Prompt parameters:**
- `prompt.text`: Describe duration, mood, genre, energy
- `format`: `mp3` (smaller), `wav` (higher quality), `aac`
- `looping`: `true` for music that loops seamlessly

## Step 2: Poll for Completion

Check status every 10 seconds until `composed`:

```bash
while true; do
  STATUS_RESPONSE=$(curl -s "https://public-api.beatoven.ai/api/v1/tasks/$TASK_ID" \
    -H "Authorization: Bearer $BEATOVEN_API_TOKEN")
  
  STATUS=$(echo $STATUS_RESPONSE | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
  echo "Status: $STATUS"
  
  if [ "$STATUS" = "composed" ]; then
    echo "✅ Track ready!"
    echo "$STATUS_RESPONSE"
    break
  elif [ "$STATUS" = "composing" ] || [ "$STATUS" = "running" ]; then
    echo "⏳ Still generating... waiting 10s"
    sleep 10
  else
    echo "❌ Unexpected status: $STATUS"
    break
  fi
done
```

## Step 3: Download the Track

Extract the URL and download to `public/`:

```bash
TRACK_URL=$(echo $STATUS_RESPONSE | grep -o '"track_url":"[^"]*"' | cut -d'"' -f4)

# Choose a descriptive filename
curl -o public/background-music.mp3 "$TRACK_URL"
echo "✅ Downloaded to public/background-music.mp3"
```

## Step 4: Use in Remotion

```tsx
import { Audio } from "@remotion/media";
import { staticFile } from "remotion";

export const MyVideo = () => {
  return (
    <>
      <Audio src={staticFile("background-music.mp3")} volume={0.3} />
      {/* Video content */}
    </>
  );
};
```

## Complete One-Liner (for quick use)

Replace the prompt text as needed:

```bash
# Start generation
TASK_ID=$(curl -s -X POST "https://public-api.beatoven.ai/api/v1/tracks/compose" \
  -H "Authorization: Bearer $BEATOVEN_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt":{"text":"30 seconds calm ambient background music"},"format":"mp3"}' \
  | grep -o '"task_id":"[^"]*"' | cut -d'"' -f4) && echo "Task: $TASK_ID"
```

```bash
# Check status (run repeatedly until "composed")
curl -s "https://public-api.beatoven.ai/api/v1/tasks/$TASK_ID" \
  -H "Authorization: Bearer $BEATOVEN_API_TOKEN"
```

## Stems (Optional)

The response also includes separate tracks for more control:

```json
{
  "stems_url": {
    "bass": "<url>",
    "chords": "<url>",
    "melody": "<url>",
    "percussion": "<url>"
  }
}
```

Download individual stems if you want to layer or mix them differently in Remotion.

## Troubleshooting

**401 Unauthorized**: Token is invalid or not set correctly
**No task_id returned**: Check the full response for error messages
**Stuck on "composing"**: Generation can take 30-60 seconds for longer tracks
