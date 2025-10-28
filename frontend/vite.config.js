import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return defineConfig({
    plugins: [
      react({
        babel: {
          plugins: [['babel-plugin-react-compiler']],
        },
      }),
      tailwindcss()
    ],
    server: {
      port: Number(env.VITE_DASHBOARD_ADDR.split(":")[1]) || 5173,
      host: env.VITE_DASHBOARD_ADDR.split(":")[0] || '127.0.0.1'
    }
  })
}
