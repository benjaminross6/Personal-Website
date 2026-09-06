import type { GeoArticle, Scene, SceneFlavor, TimeRange } from '../types'
import {
  computeInterestScore,
  getBatchArticleMetrics,
  getBatchRevisionSizes,
  getYearsFromWikipedia,
  wikiFetchForMetrics,
} from './wikipedia'

const FLAVOR_PATTERNS: Array<{ flavor: SceneFlavor; patterns: RegExp[] }> = [
  {
    flavor: 'battle',
    patterns: [/battle/i, /war/i, /siege/i, /campaign/i, /conflict/i, /invasion/i],
  },
  {
    flavor: 'person',
    patterns: [/born/i, /people/i, /politician/i, /writer/i, /artist/i, /emperor/i, /king/i],
  },
  {
    flavor: 'building',
    patterns: [/church/i, /cathedral/i, /castle/i, /monument/i, /museum/i, /palace/i, /bridge/i, /fort/i, /tower/i],
  },
  {
    flavor: 'event',
    patterns: [/disaster/i, /earthquake/i, /revolution/i, /treaty/i, /discovery/i, /expedition/i, /festival/i, /ceremony/i, /olympics/i],
  },
  {
    flavor: 'place',
    patterns: [/city/i, /town/i, /village/i, /district/i, /region/i, /island/i, /river/i, /mountain/i, /park/i, /port/i],
  },
]

const FLAVOR_LABELS: Record<SceneFlavor, string> = {
  battle: 'Conflict',
  person: 'Person',
  building: 'Landmark',
  event: 'Event',
  place: 'Place',
  other: 'Story',
}

const FLAVOR_ICONS: Record<SceneFlavor, string> = {
  battle: '⚔',
  person: '👤',
  building: '🏛',
  event: '⚡',
  place: '📍',
  other: '📜',
}

const MIN_SOURCES_PREFERRED = 3
const METRICS_CANDIDATE_LIMIT = 18

export function getFlavorLabel(flavor: SceneFlavor): string {
  return FLAVOR_LABELS[flavor]
}

export function getFlavorIcon(flavor: SceneFlavor): string {
  return FLAVOR_ICONS[flavor]
}

function classifyByTitle(title: string): SceneFlavor {
  for (const { flavor, patterns } of FLAVOR_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(title)) return flavor
    }
  }
  return 'other'
}

async function batchExtracts(titles: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>()
  if (titles.length === 0) return result

  const data = (await wikiFetchForMetrics({
    action: 'query',
    prop: 'extracts',
    exintro: 'true',
    explaintext: 'true',
    exsentences: '3',
    titles: titles.join('|'),
  })) as {
    query?: { pages?: Record<string, { title?: string; extract?: string }> }
  }

  for (const page of Object.values(data.query?.pages ?? {})) {
    if (page.title && page.extract) {
      result.set(page.title, page.extract)
    }
  }

  return result
}

/**
 * Scene selection: pick 3–5 articles near a point.
 * Prioritizes articles with many distinct sources (citations) and rich link graphs.
 */
export async function selectScenes(
  articles: GeoArticle[],
  timeRange?: TimeRange,
): Promise<Scene[]> {
  if (articles.length === 0) return []

  const candidates = articles.slice(0, 50)
  const titles = candidates.map((a) => a.title)

  const revisionSizes = await getBatchRevisionSizes(titles, wikiFetchForMetrics)

  const sized = candidates
    .map((article) => ({
      article,
      flavor: classifyByTitle(article.title),
      revisionSize: revisionSizes.get(article.title) ?? 0,
    }))
    .filter((c) => c.revisionSize > 1500 || c.flavor !== 'other')
    .sort((a, b) => b.revisionSize - a.revisionSize)

  const metricsTitles = sized.slice(0, METRICS_CANDIDATE_LIMIT).map((c) => c.article.title)
  const metrics = await getBatchArticleMetrics(metricsTitles, wikiFetchForMetrics, 2)

  const scored = sized
    .filter((c) => metrics.has(c.article.title))
    .map((c) => {
      const m = metrics.get(c.article.title)!
      return {
        ...c,
        metrics: m,
        interest: computeInterestScore(m, c.article.dist),
      }
    })
    .sort((a, b) => b.interest - a.interest)

  const rich = scored.filter((s) => s.metrics.sourceCount >= MIN_SOURCES_PREFERRED)
  const pool = rich.length >= 3 ? rich : scored

  const byFlavor = new Map<SceneFlavor, typeof pool>()
  for (const item of pool) {
    const existing = byFlavor.get(item.flavor) ?? []
    existing.push(item)
    byFlavor.set(item.flavor, existing)
  }

  const flavorOrder: SceneFlavor[] = [
    'battle',
    'event',
    'person',
    'building',
    'place',
    'other',
  ]

  const picked: typeof pool = []
  const usedTitles = new Set<string>()

  for (const flavor of flavorOrder) {
    if (picked.length >= 5) break
    const items = byFlavor.get(flavor)
    if (!items) continue
    for (const item of items) {
      if (usedTitles.has(item.article.title)) continue
      usedTitles.add(item.article.title)
      picked.push(item)
      break
    }
  }

  if (picked.length < 3) {
    for (const item of pool) {
      if (picked.length >= 5) break
      if (usedTitles.has(item.article.title)) continue
      usedTitles.add(item.article.title)
      picked.push(item)
    }
  }

  const pickedTitles = picked.map((p) => p.article.title)
  let extracts = new Map<string, string>()
  let years = new Map<string, number | undefined>()

  try {
    ;[extracts, years] = await Promise.all([
      batchExtracts(pickedTitles),
      getYearsFromWikipedia(pickedTitles),
    ])
  } catch {
    // Scenes still work without excerpts or years
  }

  let scenes: Scene[] = picked.map((item) => ({
    title: item.article.title,
    pageid: item.article.pageid,
    lat: item.article.lat,
    lng: item.article.lng,
    flavor: item.flavor,
    excerpt: (extracts.get(item.article.title) ?? '').slice(0, 200),
    year: years.get(item.article.title),
    sourceCount: item.metrics.sourceCount,
    linkCount: item.metrics.linkCount,
  }))

  if (timeRange) {
    const filtered = scenes.filter((s) => {
      if (s.year === undefined) return true
      return s.year >= timeRange.start && s.year <= timeRange.end
    })
    if (filtered.length >= 2) {
      scenes = filtered
    }
  }

  return scenes.slice(0, 5)
}

export { filterByTimeRange } from './wikipedia'
