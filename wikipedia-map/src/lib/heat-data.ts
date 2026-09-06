import type { HeatPoint } from '../types'
import {
  getTileIdsForBounds,
  loadHeatManifest,
  loadHeatTiles,
  sampleHeatPoints,
} from './heat-tiles'

export type { HeatPoint } from '../types'

const MAX_RENDER_POINTS = 4000

let legacyPoints: HeatPoint[] | null = null

function dataBaseUrl(): string {
  return import.meta.env.VITE_HEAT_DATA_URL ?? import.meta.env.BASE_URL
}

async function loadLegacyHeat(baseUrl: string): Promise<HeatPoint[]> {
  if (legacyPoints) return legacyPoints
  const response = await fetch(`${baseUrl}data/world-heat.json`)
  if (!response.ok) throw new Error('Failed to load world heat data')
  const data = (await response.json()) as { points: HeatPoint[] }
  legacyPoints = data.points
  return legacyPoints
}

/** Load heat for map viewport — tiled when manifest exists, else monolithic fallback. */
export async function loadHeatForBounds(
  bounds: { north: number; south: number; east: number; west: number },
): Promise<HeatPoint[]> {
  const baseUrl = dataBaseUrl()
  const manifest = await loadHeatManifest(baseUrl)

  if (!manifest) {
    const all = await loadLegacyHeat(baseUrl)
    return sampleHeatPoints(
      all.filter(
        (p) =>
          p.lat >= bounds.south &&
          p.lat <= bounds.north &&
          p.lng >= bounds.west &&
          p.lng <= bounds.east,
      ),
      MAX_RENDER_POINTS,
    )
  }

  const tileIds = getTileIdsForBounds(bounds.north, bounds.south, bounds.east, bounds.west)
  const knownIds = new Set(manifest.tiles.map((t) => t.id))
  const toLoad = tileIds.filter((id) => knownIds.has(id))

  if (toLoad.length === 0) return []

  const points = await loadHeatTiles(baseUrl, toLoad)
  return sampleHeatPoints(points, MAX_RENDER_POINTS)
}

/** Initial world view before bounds are known. */
export async function loadInitialHeat(): Promise<HeatPoint[]> {
  const baseUrl = dataBaseUrl()
  const manifest = await loadHeatManifest(baseUrl)
  if (manifest) {
    return loadHeatForBounds({ north: 70, south: -55, east: 180, west: -180 })
  }
  return loadLegacyHeat(baseUrl)
}
