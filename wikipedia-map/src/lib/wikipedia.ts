import type { ArticleDetail, GeoArticle, PlaceMention, TimeRange } from '../types'
import { cacheGet, cacheSet, cacheKey } from './cache'

export {
  computeInterestScore,
  countDistinctSources,
  getBatchArticleMetrics,
  getBatchRevisionSizes,
} from './article-metrics'
export type { ArticleMetrics } from './article-metrics'

const WIKI_API = import.meta.env.DEV ? '/api/wikipedia' : 'https://en.wikipedia.org/w/api.php'
const WIKIDATA_API = import.meta.env.DEV ? '/api/wikidata' : 'https://www.wikidata.org/w/api.php'

let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 500

async function throttle(): Promise<void> {
  const now = Date.now()
  const wait = MIN_REQUEST_INTERVAL - (now - lastRequestTime)
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait))
  }
  lastRequestTime = Date.now()
}

/** Shared fetch for sibling modules (scene scoring, etc.) */
export async function wikiFetchForMetrics(
  params: Record<string, string>,
): Promise<unknown> {
  return wikiFetch(params)
}

async function wikiFetch(params: Record<string, string>, retries = 2): Promise<unknown> {
  await throttle()

  const url = import.meta.env.DEV
    ? new URL(WIKI_API, window.location.origin)
    : new URL(WIKI_API)
  url.searchParams.set('origin', '*')
  url.searchParams.set('format', 'json')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const response = await fetch(url.toString())
  if (response.status === 429 && retries > 0) {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return wikiFetch(params, retries - 1)
  }
  if (!response.ok) {
    throw new Error(`Wikipedia API error: ${response.status}`)
  }
  return response.json()
}

async function wikidataFetch(params: Record<string, string>): Promise<unknown> {
  await throttle()

  const url = import.meta.env.DEV
    ? new URL(WIKIDATA_API, window.location.origin)
    : new URL(WIKIDATA_API)
  url.searchParams.set('format', 'json')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`Wikidata API error: ${response.status}`)
  }
  return response.json()
}

interface GeoSearchResponse {
  query?: {
    geosearch?: Array<{
      pageid: number
      title: string
      lat: number
      lon: number
      dist: number
    }>
  }
}

export async function geoSearch(
  lat: number,
  lng: number,
  radiusMeters = 10000,
  limit = 50,
): Promise<GeoArticle[]> {
  const key = cacheKey('geosearch', lat.toFixed(2), lng.toFixed(2), radiusMeters, limit)
  const cached = await cacheGet<GeoArticle[]>(key)
  if (cached) return cached

  const data = (await wikiFetch({
    action: 'query',
    list: 'geosearch',
    gscoord: `${lat}|${lng}`,
    gsradius: String(Math.min(radiusMeters, 10000)),
    gslimit: String(limit),
  })) as GeoSearchResponse

  const results = (data.query?.geosearch ?? []).map((item) => ({
    pageid: item.pageid,
    title: item.title,
    lat: item.lat,
    lng: item.lon,
    dist: item.dist,
  }))

  await cacheSet(key, results)
  return results
}

interface OpenSearchResponse extends Array<string | string[]> {}

/** Resolve a search query (with typos) to a Wikipedia article title */
export async function resolveArticleTitle(query: string): Promise<string | null> {
  const trimmed = query.trim()
  if (!trimmed) return null

  const key = cacheKey('opensearch', trimmed.toLowerCase())
  const cached = await cacheGet<string | null>(key)
  if (cached !== null) return cached || null

  try {
    const data = (await wikiFetch({
      action: 'opensearch',
      search: trimmed,
      limit: '1',
      namespace: '0',
    })) as OpenSearchResponse

    const titles = data[1] as string[] | undefined
    const title = titles?.[0] ?? null
    await cacheSet(key, title ?? '')
    return title
  } catch {
    return null
  }
}

interface QueryPagesResponse {
  query?: {
    pages?: Record<
      string,
      {
        pageid?: number
        title?: string
        extract?: string
        coordinates?: Array<{ lat: number; lon: number }>
        categories?: Array<{ title: string }>
        missing?: boolean
      }
    >
  }
}

export async function getArticleExtract(title: string): Promise<string> {
  const data = (await wikiFetch({
    action: 'query',
    prop: 'extracts',
    exintro: 'true',
    explaintext: 'true',
    exsentences: '3',
    titles: title,
  })) as QueryPagesResponse

  const pages = data.query?.pages ?? {}
  const page = Object.values(pages)[0]
  return page?.extract ?? ''
}

export async function getArticleCategories(title: string): Promise<string[]> {
  const data = (await wikiFetch({
    action: 'query',
    prop: 'categories',
    cllimit: '20',
    titles: title,
  })) as QueryPagesResponse

  const pages = data.query?.pages ?? {}
  const page = Object.values(pages)[0]
  return (page?.categories ?? []).map((c) => c.title.replace('Category:', ''))
}

interface ParseLinksResponse {
  parse?: {
    links?: Array<{ ns: number; '*': string }>
  }
}

export async function getArticleLinks(title: string): Promise<string[]> {
  const data = (await wikiFetch({
    action: 'parse',
    page: title,
    prop: 'links',
  })) as ParseLinksResponse

  return (data.parse?.links ?? [])
    .filter((link) => link.ns === 0)
    .map((link) => link['*'])
}

export async function getCoordinatesForTitles(
  titles: string[],
): Promise<Map<string, { lat: number; lng: number }>> {
  const result = new Map<string, { lat: number; lng: number }>()
  if (titles.length === 0) return result

  const batchSize = 50
  for (let i = 0; i < titles.length; i += batchSize) {
    const batch = titles.slice(i, i + batchSize)
    const data = (await wikiFetch({
      action: 'query',
      prop: 'coordinates',
      colimit: '1',
      titles: batch.join('|'),
    })) as QueryPagesResponse

    const pages = data.query?.pages ?? {}
    for (const page of Object.values(pages)) {
      if (page.title && page.coordinates?.[0]) {
        result.set(page.title, {
          lat: page.coordinates[0].lat,
          lng: page.coordinates[0].lon,
        })
      }
    }
  }

  return result
}

interface WikidataEntityResponse {
  entities?: Record<
    string,
    {
      claims?: {
        P585?: Array<{ mainsnak?: { datavalue?: { value?: { time?: string } } } }>
        P571?: Array<{ mainsnak?: { datavalue?: { value?: { time?: string } } } }>
        P580?: Array<{ mainsnak?: { datavalue?: { value?: { time?: string } } } }>
      }
    }
  >
}

function parseWikidataYear(timeStr: string): number | undefined {
  const match = timeStr.match(/([+-]?\d+)-/)
  if (!match) return undefined
  const year = parseInt(match[1], 10)
  return year > 0 ? year : undefined
}

function yearFromTitle(title: string): number | undefined {
  const match = title.match(/\b(1[0-9]{3}|20[0-2][0-9])\b/)
  return match ? parseInt(match[1], 10) : undefined
}

export async function getYearsFromWikipedia(
  titles: string[],
): Promise<Map<string, number | undefined>> {
  const result = new Map<string, number | undefined>()

  for (const title of titles) {
    result.set(title, yearFromTitle(title))
  }

  const batchSize = 50
  for (let i = 0; i < titles.length; i += batchSize) {
    const batch = titles.slice(i, i + batchSize)

    try {
      const data = (await wikiFetch({
        action: 'query',
        prop: 'pageprops',
        ppprop: 'wikibase_item',
        titles: batch.join('|'),
      })) as QueryPagesResponse & {
        query?: {
          pages?: Record<
            string,
            { title?: string; pageprops?: { wikibase_item?: string } }
          >
        }
      }

      const wikidataIds: string[] = []
      const titleToWikidata = new Map<string, string>()

      for (const page of Object.values(data.query?.pages ?? {})) {
        if (page.title && page.pageprops?.wikibase_item) {
          wikidataIds.push(page.pageprops.wikibase_item)
          titleToWikidata.set(page.title, page.pageprops.wikibase_item)
        }
      }

      if (wikidataIds.length === 0) continue

      const wdData = (await wikidataFetch({
        action: 'wbgetentities',
        ids: wikidataIds.join('|'),
        props: 'claims',
      })) as WikidataEntityResponse

      for (const [title, wdId] of titleToWikidata) {
        const entity = wdData.entities?.[wdId]
        if (!entity?.claims) continue

        const dateClaims = [
          ...(entity.claims.P585 ?? []),
          ...(entity.claims.P571 ?? []),
          ...(entity.claims.P580 ?? []),
        ]

        for (const claim of dateClaims) {
          const time = claim.mainsnak?.datavalue?.value?.time
          if (time) {
            const year = parseWikidataYear(time)
            if (year) {
              result.set(title, year)
              break
            }
          }
        }
      }
    } catch {
      // Wikidata is optional — title-based years already set as fallback
    }
  }

  return result
}

export async function getArticleDetail(title: string): Promise<ArticleDetail> {
  const key = cacheKey('article', title)
  const cached = await cacheGet<ArticleDetail>(key)
  if (cached) return cached

  const [extract, links] = await Promise.all([
    getArticleExtract(title),
    getArticleLinks(title),
  ])

  const uniqueLinks = [...new Set(links)].slice(0, 80)
  const coords = await getCoordinatesForTitles(uniqueLinks)

  const places: PlaceMention[] = []
  for (const [linkTitle, coord] of coords) {
    places.push({
      title: linkTitle,
      lat: coord.lat,
      lng: coord.lng,
    })
  }

  const data = (await wikiFetch({
    action: 'query',
    prop: 'extracts|info',
    exintro: 'true',
    explaintext: 'true',
    exsentences: '5',
    inprop: 'url',
    titles: title,
  })) as QueryPagesResponse & {
    query?: {
      pages?: Record<string, { fullurl?: string; pageid?: number; missing?: boolean }>
    }
  }

  const page = Object.values(data.query?.pages ?? {})[0]
  if (!page || page.missing) {
    throw new Error(`Article not found: ${title}`)
  }

  const detail: ArticleDetail = {
    title,
    pageid: page?.pageid ?? 0,
    extract: page?.extract ?? extract,
    wikiUrl: page?.fullurl ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
    places,
  }

  await cacheSet(key, detail)
  return detail
}

export async function reversePlaceName(
  lat: number,
  lng: number,
): Promise<string | undefined> {
  const articles = await geoSearch(lat, lng, 1000, 1)
  if (articles.length === 0) return undefined

  const title = articles[0].title
  if (
    title.includes('County') ||
    title.includes('City') ||
    title.includes('District') ||
    title.includes('Region') ||
    title.includes('Province') ||
    title.includes('State')
  ) {
    return title
  }

  return title
}

export function filterByTimeRange<T extends { year?: number }>(
  items: T[],
  range: TimeRange,
): T[] {
  return items.filter((item) => {
    if (item.year === undefined) return true
    return item.year >= range.start && item.year <= range.end
  })
}
