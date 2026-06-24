---
description: Launch the Schedoughler dev server and drive it in a browser
---

# Run

Start the dev server in the background, wait for it to be ready, then drive it with Playwright.

## Start

```bash
npm run dev &
DEV_PID=$!
trap 'kill $DEV_PID 2>/dev/null' EXIT
timeout 30 bash -c 'until curl -sf http://localhost:5173 >/dev/null 2>&1; do sleep 0.5; done'
```

Default URL: **http://localhost:5173**

## Drive (Playwright via npx)

```javascript
// Run as: node -e "..." from the project root
const { chromium } = require('/home/sboe0705/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://localhost:5173');
  await page.waitForSelector('text=Sauerteigbrot');
  // interact here
  await page.screenshot({ path: 'schedoughler-screenshot.png', fullPage: true });
  await browser.close();
})();
```

Or use the project's `screenshot.sh` which handles everything (see the screenshot skill).

## Stop

```bash
pkill -f 'vite' 2>/dev/null || true
```
