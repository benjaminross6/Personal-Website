import { cacheGet, cacheSet, cacheKey } from './cache'

export interface ArticleMetrics {
  sourceCount: number
  linkCount: number
  revisionSize: number
}

/** Count distinct Wikipedia citation sources in wikitext. */
export function countDistinctSources(wikitext: string): number {
  const named = new Set<string>()
  const namedRe = /<ref\s+name=["']([^"']+)["']/gi
  let match: RegExpExecArray | null
  while ((match = namedRe.exec(wikitext)) !== null) {
    named.add(match[1].trim().toLowerCase())
  }

  const allRefs = wikitext.match(/<ref[\s/>]/gi)?.length ?? 0
  const namedOpens = wikitext.match(/<ref\s+name=/gi)?.length ?? 0
  const unnamed = Math.max(0, allRefs - namedOpens)

  return named.size + unnamed
}

interface ParseResponse {
  parse?: {
    wikitext?: { '*': string }
    links?: Array<{ ns: number; '*': string }>
  }
}

interface RevisionResponse {
  query?: {
    pages?: Record<
      string,
      {
        title?: string
        revisions?: Array<{ size?: number }>
      }
    >
  }
}

async function parseArticleMetrics(
  title: string,
  wikiFetch: (params: Record<string, string>) => Promise<unknown>,
): Promise<ArticleMetrics> {
  const key = cacheKey('metrics', title)
  const cached = await cacheGet<ArticleMetrics>(key)
  if (cached) return cached

  const data = (await wikiFetch({
    action: 'parse',
    page: title,
    prop: 'wikitext|links',
  })) as ParseResponse

  const wikitext = data.parse?.wikitext?.['*'] ?? ''
  const links = (data.parse?.links ?? []).filter((l) => l.ns === 0)

  const metrics: ArticleMetrics = {
    sourceCount: countDistinctSources(wikitext),
    linkCount: links.length,
    revisionSize: wikitext.length,
  }

  await cacheSet(key, metrics)
  return metrics
}

/** Batch-fetch revision sizes (one API call) to pre-filter candidates. */
export async function getBatchRevisionSizes(
  titles: string[],
  wikiFetch: (params: Record<string, string>) => Promise<unknown>,
): Promise<Map<string, number>> {
  const result = new Map<string, number>()
  if (titles.length === 0) return result

  const batchSize = 50
  for (let i = 0; i < titles.length; i += batchSize) {
    const batch = titles.slice(i, i + batchSize)
    const data = (await wikiFetch({
      action: 'query',
      prop: 'revisions',
      rvprop: 'size',
      rvlimit: '1',
      titles: batch.join('|'),
    })) as RevisionResponse

    for (const page of Object.values(data.query?.pages ?? {})) {
      if (page.title && page.revisions?.[0]?.size !== undefined) {
        result.set(page.title, page.revisions[0].size)
      }
    }
  }

  return result
}

/** Fetch source + link metrics for titles (cached, throttled via wikiFetch). */
export async function getBatchArticleMetrics(
  titles: string[],
  wikiFetch: (params: Record<string, string>) => Promise<unknown>,
  concurrency = 2,
): Promise<Map<string, ArticleMetrics>> {
  const result = new Map<string, ArticleMetrics>()
  const queue = [...titles]

  async function worker() {
    while (queue.length > 0) {
      const title = queue.shift()
      if (!title) break
      try {
        const metrics = await parseArticleMetrics(title, wikiFetch)
        result.set(title, metrics)
      } catch {
        result.set(title, { sourceCount: 0, linkCount: 0, revisionSize: 0 })
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()))
  return result
}

/** Higher = more interesting for the rabbit hole. */
export function computeInterestScore(
  metrics: ArticleMetrics,
  distMeters: number,
): number {
  const proximity = 2 / (distMeters + 500)
  return (
    metrics.sourceCount * 6 +
    Math.min(metrics.linkCount, 300) * 0.4 +
    Math.log10(Math.max(metrics.revisionSize, 500)) * 2 +
    proximity
  )
}
