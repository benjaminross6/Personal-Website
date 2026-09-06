import { useCallback, useState } from 'react'
import { MapView } from './components/MapView'
import { CaseBoard } from './components/CaseBoard'
import { ArticlePanel } from './components/ArticlePanel'
import { TimeRangeSlider } from './components/TimeRangeSlider'
import type { AppView, ArticleDetail, MapTarget, Scene, TimeRange } from './types'
import {
  geoSearch,
  getArticleDetail,
  getCoordinatesForTitles,
  resolveArticleTitle,
  reversePlaceName,
} from './lib/wikipedia'
import { selectScenes } from './lib/scenes'

const DEFAULT_TIME_RANGE: TimeRange = { start: -3000, end: 2025 }

function App() {
  const [view, setView] = useState<AppView>({ mode: 'map' })
  const [timeRange, setTimeRange] = useState<TimeRange>(DEFAULT_TIME_RANGE)
  const [scenes, setScenes] = useState<Scene[]>([])
  const [scenesLoading, setScenesLoading] = useState(false)
  const [placeName, setPlaceName] = useState<string>()
  const [article, setArticle] = useState<ArticleDetail | null>(null)
  const [articleLoading, setArticleLoading] = useState(false)
  const [articleError, setArticleError] = useState<string>()
  const [caseBoardError, setCaseBoardError] = useState<string>()
  const [placeMarkers, setPlaceMarkers] = useState<
    Array<{ title: string; lat: number; lng: number }>
  >([])
  const [mapTarget, setMapTarget] = useState<MapTarget>()
  const [articleSearch, setArticleSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [toast, setToast] = useState<string>()

  const showToast = useCallback((message: string) => {
    setToast(message)
    setTimeout(() => setToast(undefined), 4000)
  }, [])

  const loadCaseBoard = useCallback(
    async (lat: number, lng: number) => {
      setScenesLoading(true)
      setCaseBoardError(undefined)
      setPlaceName(undefined)
      setMapTarget({ kind: 'point', lat, lng })
      setView({ mode: 'caseboard', lat, lng })

      try {
        const articles = await geoSearch(lat, lng, 10000, 50)

        if (articles.length === 0) {
          setCaseBoardError('No Wikipedia articles found here. Try a city or landmark.')
          setScenes([])
          return
        }

        const name = await reversePlaceName(lat, lng).catch(() => articles[0]?.title)
        setPlaceName(name)

        const selected = await selectScenes(articles, timeRange)
        setScenes(selected)

        if (selected.length === 0) {
          setCaseBoardError('Nothing matched your time filter here. Try widening the range.')
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Could not reach Wikipedia'
        setCaseBoardError(msg.includes('429') ? 'Wikipedia is busy — wait a moment and try again.' : msg)
        setScenes([])
      } finally {
        setScenesLoading(false)
      }
    },
    [timeRange],
  )

  const loadArticle = useCallback(
    async (title: string, returnTo: AppView) => {
      setArticleLoading(true)
      setArticleError(undefined)
      setArticle(null)
      setView({ mode: 'article', title, returnTo })

      try {
        const detail = await getArticleDetail(title)
        setArticle(detail)
        setPlaceMarkers(detail.places)

        if (detail.places.length > 0) {
          setMapTarget({
            kind: 'places',
            points: detail.places.map((p) => ({ lat: p.lat, lng: p.lng })),
          })
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Could not load article'
        setArticleError(msg.includes('429') ? 'Wikipedia is busy — wait a moment and try again.' : msg)
      } finally {
        setArticleLoading(false)
      }
    },
    [],
  )

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      loadCaseBoard(lat, lng)
    },
    [loadCaseBoard],
  )

  const handleSelectScene = useCallback(
    (title: string) => {
      const returnTo = view.mode === 'caseboard' ? view : { mode: 'map' as const }
      loadArticle(title, returnTo)
    },
    [view, loadArticle],
  )

  const handlePlaceClick = useCallback(
    async (title: string) => {
      const coords = await getCoordinatesForTitles([title])
      const coord = coords.get(title)
      if (coord) {
        loadCaseBoard(coord.lat, coord.lng)
      } else {
        loadArticle(title, view.mode === 'article' ? view.returnTo : view)
      }
    },
    [view, loadCaseBoard, loadArticle],
  )

  const handleBack = useCallback(() => {
    if (view.mode === 'article') {
      setArticle(null)
      setArticleError(undefined)
      setPlaceMarkers([])
      setView(view.returnTo)
    } else if (view.mode === 'caseboard') {
      setScenes([])
      setCaseBoardError(undefined)
      setPlaceName(undefined)
      setView({ mode: 'map' })
    }
  }, [view])

  const handleArticleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const query = articleSearch.trim()
      if (!query) return

      setShowSearch(false)
      setArticleLoading(true)
      setArticle(null)
      setArticleError(undefined)
      setView({ mode: 'article', title: query, returnTo: { mode: 'map' } })

      try {
        const resolved = await resolveArticleTitle(query)
        if (!resolved) {
          setArticleError(`No article found for "${query}". Check the spelling.`)
          setArticleLoading(false)
          return
        }

        if (resolved !== query) {
          showToast(`Showing: ${resolved}`)
        }

        const detail = await getArticleDetail(resolved)
        setArticle(detail)
        setPlaceMarkers(detail.places)
        setView({ mode: 'article', title: resolved, returnTo: { mode: 'map' } })

        if (detail.places.length > 0) {
          setMapTarget({
            kind: 'places',
            points: detail.places.map((p) => ({ lat: p.lat, lng: p.lng })),
          })
        } else {
          showToast('Article loaded, but no geotagged places found in it.')
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Could not load article'
        setArticleError(msg.includes('429') ? 'Wikipedia is busy — wait a moment and try again.' : msg)
      } finally {
        setArticleLoading(false)
      }
    },
    [articleSearch, showToast],
  )

  const handleTimeRangeChange = useCallback(
    (range: TimeRange) => {
      setTimeRange(range)
      if (view.mode === 'caseboard') {
        loadCaseBoard(view.lat, view.lng)
      }
    },
    [view, loadCaseBoard],
  )

  return (
    <div className="relative w-full h-full">
      <MapView
        onMapClick={handleMapClick}
        placeMarkers={placeMarkers}
        onPlaceClick={handlePlaceClick}
        mapTarget={mapTarget}
      />

      <div className="absolute top-0 left-0 z-[1000] p-6 pointer-events-none">
        <h1 className="text-3xl font-serif text-amber-100 drop-shadow-lg">
          Wikipedia Map
        </h1>
        <p className="text-sm text-amber-200/60 mt-1 italic max-w-xs">
          Click a glowing place. Follow the trail. Get lost.
        </p>
      </div>

      <div className="absolute top-6 right-6 z-[1000]">
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="bg-[#0f1419]/90 backdrop-blur-md border border-amber-900/30 text-amber-200 px-4 py-2 rounded-lg text-sm hover:bg-amber-950/50 transition-colors"
        >
          Start from article
        </button>
        {showSearch && (
          <form
            onSubmit={handleArticleSearch}
            className="mt-2 bg-[#0f1419]/95 backdrop-blur-md border border-amber-900/30 rounded-lg p-3 shadow-2xl"
          >
            <input
              type="text"
              value={articleSearch}
              onChange={(e) => setArticleSearch(e.target.value)}
              placeholder="e.g. Battle of Waterloo"
              className="w-64 bg-transparent border border-amber-900/30 rounded px-3 py-2 text-sm text-amber-100 placeholder:text-amber-200/30 focus:outline-none focus:border-amber-600"
              autoFocus
            />
            <button
              type="submit"
              className="mt-2 w-full bg-amber-900/40 text-amber-200 py-2 rounded text-sm hover:bg-amber-900/60 transition-colors"
            >
              Explode onto map
            </button>
          </form>
        )}
      </div>

      <TimeRangeSlider range={timeRange} onChange={handleTimeRangeChange} />

      {toast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1001] bg-amber-900/90 text-amber-100 px-4 py-2 rounded-lg text-sm backdrop-blur-sm shadow-lg">
          {toast}
        </div>
      )}

      {view.mode === 'caseboard' && (
        <CaseBoard
          placeName={placeName ?? view.placeName}
          lat={view.lat}
          lng={view.lng}
          scenes={scenes}
          loading={scenesLoading}
          error={caseBoardError}
          onSelectScene={handleSelectScene}
          onClose={handleBack}
        />
      )}

      {view.mode === 'article' && article && (
        <ArticlePanel
          article={article}
          loading={articleLoading}
          onPlaceClick={handlePlaceClick}
          onOpenWikipedia={() => window.open(article.wikiUrl, '_blank')}
          onBack={handleBack}
        />
      )}

      {view.mode === 'article' && !article && (
        <div className="absolute top-0 right-0 w-full max-w-md h-full z-[1000] flex flex-col bg-[#0f1419]/95 backdrop-blur-md border-l border-amber-900/30">
          <div className="p-6">
            <button
              onClick={handleBack}
              className="text-amber-200/60 hover:text-amber-200 text-sm mb-4 transition-colors"
            >
              ← Back
            </button>
            {articleLoading && (
              <div className="text-amber-200/50 animate-pulse">Opening article…</div>
            )}
            {articleError && (
              <div>
                <p className="text-red-300 text-sm mb-4">{articleError}</p>
                <p className="text-amber-200/50 text-sm">
                  Try a different spelling, or click the map instead.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
