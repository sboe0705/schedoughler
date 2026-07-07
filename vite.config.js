import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { execSync } from 'node:child_process'

function commitInfo() {
  try {
    const [hash, date] = execSync('git log -1 --format=%h,%cd --date=short').toString().trim().split(',')
    return { hash, date }
  } catch {
    return { hash: 'dev', date: new Date().toISOString().slice(0, 10) }
  }
}

const { hash: commitHash, date: commitDate } = commitInfo()

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: process.env.GITHUB_REPOSITORY
    ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
    : '/',
  define: {
    __APP_COMMIT__: JSON.stringify(commitHash),
    __APP_COMMIT_DATE__: JSON.stringify(commitDate),
  },
})
