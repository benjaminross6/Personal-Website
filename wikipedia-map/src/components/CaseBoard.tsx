import type { Scene } from '../types'
import { getFlavorIcon, getFlavorLabel } from '../lib/scenes'

interface CaseBoardProps {
  placeName?: string
  lat: number
  lng: number
  scenes: Scene[]
  loading: boolean
  error?: string
  onSelectScene: (title: string) => void
  onClose: () => void
}

export function CaseBoard({
  placeName,
  lat,
  lng,
  scenes,
  loading,
  error,
  onSelectScene,
  onClose,
}: CaseBoardProps) {
  return (
    <div className="absolute top-0 right-0 w-full max-w-md h-full z-[1000] flex flex-col bg-[#0f1419]/95 backdrop-blur-md border-l border-amber-900/30 shadow-2xl">
      <div className="p-6 border-b border-amber-900/20">
        <button
          onClick={onClose}
          className="text-amber-200/60 hover:text-amber-200 text-sm mb-4 transition-colors"
        >
          ← Back to map
        </button>
        <h2 className="text-2xl font-serif text-amber-100 mb-1">
          {placeName ?? 'This place'}
        </h2>
        <p className="text-sm text-amber-200/50 font-mono">
          {lat.toFixed(2)}°N, {lng.toFixed(2)}°E
        </p>
        <p className="text-sm text-amber-200/70 mt-3 italic">
          What happened here? Pick a door.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && (
          <div className="text-center py-12 text-amber-200/50">
            <div className="animate-pulse">Ranking articles by sources…</div>
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-8 px-4">
            <p className="text-red-300 text-sm mb-2">{error}</p>
            <p className="text-amber-200/40 text-sm">Try clicking somewhere else, or wait and retry.</p>
          </div>
        )}

        {!loading && !error && scenes.length === 0 && (
          <div className="text-center py-12 text-amber-200/50">
            Nothing in the encyclopedia here. Try somewhere else on the map.
          </div>
        )}

        {!loading &&
          scenes.map((scene) => (
            <button
              key={scene.pageid}
              onClick={() => onSelectScene(scene.title)}
              className="w-full text-left p-4 rounded-lg border border-amber-900/30 bg-amber-950/20 hover:bg-amber-950/40 hover:border-amber-700/50 transition-all group"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{getFlavorIcon(scene.flavor)}</span>
                <span className="text-xs uppercase tracking-wider text-amber-400/80 font-sans">
                  {getFlavorLabel(scene.flavor)}
                </span>
                <span className="text-xs text-amber-200/40 font-mono ml-auto flex gap-2">
                  {scene.sourceCount !== undefined && scene.sourceCount > 0 && (
                    <span>{scene.sourceCount} sources</span>
                  )}
                  {scene.year && <span>{scene.year}</span>}
                </span>
              </div>
              <h3 className="text-lg font-serif text-amber-100 group-hover:text-amber-50 mb-2">
                {scene.title}
              </h3>
              {scene.excerpt && (
                <p className="text-sm text-amber-200/60 line-clamp-3 leading-relaxed">
                  {scene.excerpt}
                </p>
              )}
            </button>
          ))}
      </div>
    </div>
  )
}
