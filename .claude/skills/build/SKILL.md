---
description: Run tests and build the Schedoughler project
---

# Build

Run the project's `build.sh` script, which executes `npm test` then `npm run build` in sequence.

```bash
./build.sh
```

- Tests use **Vitest** (`src/scheduler.test.js`).
- Build output lands in `dist/`.
- The script exits non-zero on the first failure, so a passing run means both tests and build succeeded.
