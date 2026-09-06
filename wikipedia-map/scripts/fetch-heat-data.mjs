/**
 * Fetches real Wikipedia geosearch data for a world grid and writes world-heat.json.
 * Run when Wikipedia API is available (not rate-limited):
 *   node scripts/fetch-heat-data.mjs
 *
 * This replaces the city-based estimate from generate-heat-data.mjs
 * with actual encyclopedia density data.
 */

import { writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const WIKI_API = 'https://en.wikipedia.org/w/api.php'
const USER_AGENT = 'WikipediaMap/1.0 (educational; heat-data-generator)'

const GRID = 12 // 12x12 = 144 sample points worldwide
const DELAY_MS = 600

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function geoSearch(lat, lng) {
  const url = new URL(WIKI_API)
  url.searchParams.set('action', 'query')
  url.searchParams.set('list', 'geosearch')
  url.searchParams.set('gscoord', `${lat}|${lng}`)
  url.searchParams.set('gsradius', '50000')
  url.searchParams.set('gslimit', '20')
  url.searchParams.set('format', 'json')

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': USER_AGENT },
  })

  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return data.query?.geosearch ?? []
}

const points = []
const seen = new Set()

for (let i = 0; i <= GRID; i++) {
  for (let j = 0; j <= GRID; j++) {
    const lat = -60 + (i / GRID) * 120
    const lng = -170 + (j / GRID) * 340

    process.stdout.write(`Sampling ${lat.toFixed(0)},${lng.toFixed(0)}... `)

    try {
      const articles = await geoSearch(lat, lng)
      let added = 0
      for (const a of articles) {
        if (!seen.has(a.pageid)) {
          seen.add(a.pageid)
          points.push({
            lat: a.lat,
            lng: a.lon,
            intensity: 0.5,
            title: a.title,
          })
          added++
        }
      }
      console.log(`${added} articles`)
    } catch (err) {
      console.log(`failed: ${err.message}`)
    }

    await sleep(DELAY_MS)
  }
}

// Boost intensity where articles cluster
const density = new Map()
for (const p of points) {
  const key = `${p.lat.toFixed(0)},${p.lng.toFixed(0)}`
  density.set(key, (density.get(key) ?? 0) + 1)
}
for (const p of points) {
  const key = `${p.lat.toFixed(0)},${p.lng.toFixed(0)}`
  p.intensity = Math.min((density.get(key) ?? 1) * 0.25, 1)
}

const outDir = join(__dirname, '..', 'public', 'data')
mkdirSync(outDir, { recursive: true })
const outPath = join(outDir, 'world-heat.json')
writeFileSync(outPath, JSON.stringify({ generated: new Date().toISOString(), source: 'wikipedia-api', points }))
console.log(`\nWrote ${points.length} real heat points to ${outPath}`)
