import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// 개발 서버도 배포(vercel.json)와 같이 /api/ai → AI 서버, /api → 백엔드로 넘긴다.
// 같은 출처로 보내야 SameSite=Lax 로그인 쿠키가 실린다. 로컬 서버를 쓰려면 .env.local에 DEV_API_PROXY / DEV_AI_PROXY를 적는다.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.DEV_API_PROXY || 'https://mr-world-backend.duckdns.org'
  const aiTarget = env.DEV_AI_PROXY || 'https://mr-world-ai.duckdns.org'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api/ai': { target: aiTarget, changeOrigin: true },
        '/api': { target: apiTarget, changeOrigin: true, cookieDomainRewrite: '' },
      },
    },
  }
})
