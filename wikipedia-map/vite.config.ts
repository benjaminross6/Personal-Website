import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const wikiHeaders = {
  'User-Agent': 'WikipediaMap/1.0 (https://github.com/wikipedia-map; educational project)',
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/wikidata': {
        target: 'https://www.wikidata.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/wikidata\/?/, '/w/api.php'),
        headers: wikiHeaders,
      },
      '/api/wikipedia': {
        target: 'https://en.wikipedia.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/wikipedia\/?/, '/w/api.php'),
        headers: wikiHeaders,
      },
    },
  },
})
