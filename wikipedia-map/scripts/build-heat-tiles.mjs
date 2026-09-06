/**
 * Build heat map tiles from world-heat.json (or inline points).
 * Output: public/data/heat/manifest.json + public/data/heat/tiles/{latIdx}_{lngIdx}.json
 *
 * Usage:
 *   node scripts/build-heat-tiles.mjs
 *   node scripts/build-heat-tiles.mjs --input path/to/points.json
 *
 * For full English Wikipedia coverage, ingest geotagged articles from the
 * Wikipedia dump into a points JSON, then run this script. See docs/scaling.md.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TILE_LAT = 5
const TILE_LNG = 5

const inputArg = process.argv.indexOf('--input')
const inputPath =
  inputArg >= 0
    ? process.argv[inputArg + 1]
    : join(__dirname, '..', 'public', 'data', 'world-heat.json')

if (!existsSync(inputPath)) {
  console.error(`Input not found: ${inputPath}`)
  process.exit(1)
}

const raw = JSON.parse(readFileSync(inputPath, 'utf8'))
const points = raw.points ?? raw

function tileId(lat, lng) {
  return `${Math.floor(lat / TILE_LAT)}_${Math.floor(lng / TILE_LNG)}`
}

const tiles = new Map()

for (const p of points) {
  const id = tileId(p.lat, p.lng)
  if (!tiles.has(id)) tiles.set(id, [])
  tiles.get(id).push({
    lat: p.lat,
    lng: p.lng,
    intensity: p.intensity ?? 0.5,
    title: p.title,
  })
}

const outDir = join(__dirname, '..', 'public', 'data', 'heat', 'tiles')
mkdirSync(outDir, { recursive: true })

const manifestTiles = []

for (const [id, tilePoints] of tiles) {
  const [latIdx, lngIdx] = id.split('_').map(Number)
  writeFileSync(
    join(outDir, `${id}.json`),
    JSON.stringify({ id, points: tilePoints }),
  )
  manifestTiles.push({
    id,
    latMin: latIdx * TILE_LAT,
    latMax: (latIdx + 1) * TILE_LAT,
    lngMin: lngIdx * TILE_LNG,
    lngMax: (lngIdx + 1) * TILE_LNG,
    count: tilePoints.length,
  })
}

const manifest = {
  version: 1,
  tileLatSize: TILE_LAT,
  tileLngSize: TILE_LNG,
  totalPoints: points.length,
  generated: new Date().toISOString(),
  tiles: manifestTiles.sort((a, b) => a.id.localeCompare(b.id)),
}

const manifestPath = join(__dirname, '..', 'public', 'data', 'heat', 'manifest.json')
mkdirSync(dirname(manifestPath), { recursive: true })
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))

console.log(`Built ${manifestTiles.length} tiles, ${points.length} points`)
console.log(`Manifest: ${manifestPath}`)
