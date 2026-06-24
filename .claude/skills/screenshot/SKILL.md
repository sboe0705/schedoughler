---
description: Capture a full-page screenshot of the running Schedoughler app
---

# Screenshot

Use the project's `screenshot.sh` script. It starts the dev server if needed (port **5199**), waits until ready, takes a full-page screenshot at a 390×844 mobile viewport, then stops the server.

```bash
./screenshot.sh [output.png]
```

Default output filename: `schedoughler-screenshot.png`

## What the script does internally

1. `npx playwright install chromium` — ensures the browser binary is present (no-op when already installed).
2. Starts `npm run dev -- --port 5199` in the background if port 5199 is not already serving.
3. Polls with `curl` until the server responds (max 30 s).
4. Runs `npx playwright screenshot --full-page --viewport-size "390, 844" --wait-for-selector "text=Sauerteigbrot"`.
5. Kills the dev server it started (via `trap`).

## Playwright module location (if driving programmatically)

```
/home/sboe0705/.npm/_npx/e41f203b7505f1fb/node_modules/playwright
```
