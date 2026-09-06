import type { TimeRange } from '../types'

interface TimeRangeSliderProps {
  range: TimeRange
  onChange: (range: TimeRange) => void
}

const MIN_YEAR = -3000
const MAX_YEAR = 2025

export function TimeRangeSlider({ range, onChange }: TimeRangeSliderProps) {
  function formatYear(year: number): string {
    if (year < 0) return `${Math.abs(year)} BCE`
    return `${year} CE`
  }

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-lg px-4">
      <div className="bg-[#0f1419]/90 backdrop-blur-md border border-amber-900/30 rounded-xl p-4 shadow-2xl">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs uppercase tracking-wider text-amber-400/80 font-sans">
            Time lens
          </span>
          <span className="text-sm font-mono text-amber-200/80">
            {formatYear(range.start)} — {formatYear(range.end)}
          </span>
        </div>

        <div className="relative h-8">
          <input
            type="range"
            min={MIN_YEAR}
            max={MAX_YEAR}
            value={range.start}
            onChange={(e) => {
              const start = parseInt(e.target.value, 10)
              onChange({ start, end: Math.max(start, range.end) })
            }}
            className="absolute w-full h-1 top-3 appearance-none bg-amber-900/40 rounded-full pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
          />
          <input
            type="range"
            min={MIN_YEAR}
            max={MAX_YEAR}
            value={range.end}
            onChange={(e) => {
              const end = parseInt(e.target.value, 10)
              onChange({ start: Math.min(range.start, end), end })
            }}
            className="absolute w-full h-1 top-3 appearance-none bg-transparent rounded-full pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-200 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
          />
        </div>

        <div className="flex justify-between mt-2">
          <button
            onClick={() => onChange({ start: MIN_YEAR, end: MAX_YEAR })}
            className="text-xs text-amber-200/50 hover:text-amber-200 transition-colors"
          >
            All history
          </button>
          <button
            onClick={() => onChange({ start: 1800, end: 1900 })}
            className="text-xs text-amber-200/50 hover:text-amber-200 transition-colors"
          >
            19th century
          </button>
          <button
            onClick={() => onChange({ start: 1900, end: 2000 })}
            className="text-xs text-amber-200/50 hover:text-amber-200 transition-colors"
          >
            20th century
          </button>
        </div>
      </div>
    </div>
  )
}
