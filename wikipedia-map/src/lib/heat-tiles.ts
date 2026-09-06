import type { HeatPoint } from '../types'

export const TILE_LAT_SIZE = 5
export const TILE_LNG_SIZE = 5

export interface HeatTileManifest {
  version: number
  tileLatSize: number
  tileLngSize: number
  totalPoints: number
  generated: string
  tiles: Array<{
    id: string
    latMin: number
    latMax: number
    lngMin: number
    lngMax: number
    count: number
  }>
}

export interface HeatTileFile {
  id: string
  points: HeatPoint[]
}

export function tileIdForCoord(lat: number, lng: number): string {
  const latIdx = Math.floor(lat / TILE_LAT_SIZE)
  const lngIdx = Math.floor(lng / TILE_LNG_SIZE)
  return `${latIdx}_${lngIdx}`
}

export function tileBounds(id: string): { latMin: number; latMax: number; lngMin: number; lngMax: number } {
  const [latIdx, lngIdx] = id.split('_').map(Number)
  return {
    latMin: latIdx * TILE_LAT_SIZE,
    latMax: (latIdx + 1) * TILE_LAT_SIZE,
    lngMin: lngIdx * TILE_LNG_SIZE,
    lngMax: (lngIdx + 1) * TILE_LNG_SIZE,
  }
}

export function getTileIdsForBounds(
  north: number,
  south: number,
  east: number,
  west: number,
): string[] {
  const ids = new Set<string>()
  const latStart = Math.floor(south / TILE_LAT_SIZE)
  const latEnd = Math.floor(north / TILE_LAT_SIZE)
  const lngStart = Math.floor(west / TILE_LNG_SIZE)
  const lngEnd = Math.floor(east / TILE_LNG_SIZE)

  for (let latIdx = latStart; latIdx <= latEnd; latIdx++) {
    for (let lngIdx = lngStart; lngIdx <= lngEnd; lngIdx++) {
      ids.add(`${latIdx}_${lngIdx}`)
    }
  }

  return [...ids]
}

const manifestCache: { manifest?: HeatTileManifest } = {}
const tileCache = new Map<string, HeatPoint[]>()

export async function loadHeatManifest(baseUrl: string): Promise<HeatTileManifest | null> {
  if (manifestCache.manifest) return manifestCache.manifest

  try {
    const res = await fetch(`${baseUrl}data/heat/manifest.json`)
    if (!res.ok) return null
    manifestCache.manifest = (await res.json()) as HeatTileManifest
    return manifestCache.manifest
  } catch {
    return null
  }
}

export async function loadHeatTile(baseUrl: string, tileId: string): Promise<HeatPoint[]> {
  if (tileCache.has(tileId)) return tileCache.get(tileId)!

  try {
    const res = await fetch(`${baseUrl}data/heat/tiles/${tileId}.json`)
    if (!res.ok) return []
    const data = (await res.json()) as HeatTileFile
    tileCache.set(tileId, data.points)
    return data.points
  } catch {
    return []
  }
}

export async function loadHeatTiles(baseUrl: string, tileIds: string[]): Promise<HeatPoint[]> {
  const results = await Promise.all(tileIds.map((id) => loadHeatTile(baseUrl, id)))
  return results.flat()
}

/** Cap rendered markers; keep highest-intensity points when over budget. */
export function sampleHeatPoints(points: HeatPoint[], maxPoints: number): HeatPoint[] {
  if (points.length <= maxPoints) return points
  return [...points]
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, maxPoints)
}

export function clearHeatTileCache(): void {
  manifestCache.manifest = undefined
  tileCache.clear()
}
