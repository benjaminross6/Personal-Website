import type { ArticleDetail } from '../types'

interface ArticlePanelProps {
  article: ArticleDetail
  loading: boolean
  onPlaceClick: (title: string) => void
  onOpenWikipedia: () => void
  onBack: () => void
}

export function ArticlePanel({
  article,
  loading,
  onPlaceClick,
  onOpenWikipedia,
  onBack,
}: ArticlePanelProps) {
  return (
    <div className="absolute top-0 right-0 w-full max-w-md h-full z-[1000] flex flex-col bg-[#0f1419]/95 backdrop-blur-md border-l border-amber-900/30 shadow-2xl">
      <div className="p-6 border-b border-amber-900/20">
        <button
          onClick={onBack}
          className="text-amber-200/60 hover:text-amber-200 text-sm mb-4 transition-colors"
        >
          ← Back
        </button>
        <h2 className="text-2xl font-serif text-amber-100 mb-3">{article.title}</h2>
        {loading ? (
          <div className="animate-pulse text-amber-200/50 text-sm">Loading article…</div>
        ) : (
          <p className="text-sm text-amber-200/70 leading-relaxed">{article.extract}</p>
        )}
        <button
          onClick={onOpenWikipedia}
          className="mt-4 text-sm text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors"
        >
          Read on Wikipedia →
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-xs uppercase tracking-wider text-amber-400/80 font-sans mb-3">
          Places mentioned ({article.places.length})
        </h3>

        {article.places.length === 0 && !loading && (
          <p className="text-sm text-amber-200/40 italic">
            No geotagged places in this article. The trail ends here — or pick another scene.
          </p>
        )}

        <div className="space-y-2">
          {article.places.map((place) => (
            <button
              key={place.title}
              onClick={() => onPlaceClick(place.title)}
              className="w-full text-left px-3 py-2 rounded border border-amber-900/20 bg-amber-950/10 hover:bg-amber-950/30 hover:border-amber-700/40 transition-all text-sm text-amber-200/80 hover:text-amber-100"
            >
              📍 {place.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
