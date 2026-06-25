#!/usr/bin/env bash
set -e
npm test
npm run tauri:build
