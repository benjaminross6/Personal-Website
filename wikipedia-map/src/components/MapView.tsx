import { useCallback, useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { loadInitialHeat, loadHeatForBounds, type HeatPoint } from '../lib/heat-data'
import type { MapTarget } from '../types'

const markerIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="width:12px;height:12px;background:#ffc93c;border-radius:50%;border:2px solid #fff;box-shadow:0 0 8px rgba(255,201,60,0.6)"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
})

const FIT_PADDING_TOP_LEFT: L.PointExpression = [48, 48]
const FIT_PADDING_BOTTOM_RIGHT: L.PointExpression = [420, 120]

interface MapViewProps {
  onMapClick: (lat: number, lng: number) => void
  placeMarkers?: Array<{ title: string; lat: number; lng: number }>
  onPlaceClick?: (title: string) => void
  mapTarget?: MapTarget
}

function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function MapFit({ target }: { target?: MapTarget }) {
  const map = useMap()

  useEffect(() => {
    if (!target) return

    if (target.kind === 'point') {
      map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 7), { duration: 1.2 })
      return
    }

    const { points } = target
    if (points.length === 0) return

    if (points.length === 1) {
      map.flyTo([points[0].lat, points[0].lng], 10, { duration: 1.2 })
      return
    }

    const lats = points.map((p) => p.lat)
    const lngs = points.map((p) => p.lng)
    const latSpan = Math.max(...lats) - Math.min(...lats)
    const lngSpan = Math.max(...lngs) - Math.min(...lngs)

    if (latSpan < 0.05 && lngSpan < 0.05) {
      const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length
      const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length
      map.flyTo([centerLat, centerLng], 11, { duration: 1.2 })
      return
    }

    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]))
    map.flyToBounds(bounds, {
      paddingTopLeft: FIT_PADDING_TOP_LEFT,
      paddingBottomRight: FIT_PADDING_BOTTOM_RIGHT,
      maxZoom: 12,
      duration: 1.2,
    })
  }, [map, target])

  return null
}

function HeatMarkers({ points }: { points: HeatPoint[] }) {
  return (
    <>
      {points.map((spot, i) => (
        <CircleMarker
          key={`heat-${spot.lat.toFixed(3)}-${spot.lng.toFixed(3)}-${i}`}
          center={[spot.lat, spot.lng]}
          radius={2 + spot.intensity * 10}
          pathOptions={{
            color: 'transparent',
            fillColor: spot.intensity > 0.7 ? '#ffc93c' : spot.intensity > 0.4 ? '#ff6b35' : '#e94560',
            fillOpacity: 0.15 + spot.intensity * 0.35,
            weight: 0,
          }}
          interactive={false}
        />
      ))}
    </>
  )
}

function HeatTileLoader({
  onPoints,
  onError,
}: {
  onPoints: (points: HeatPoint[]) => void
  onError: (msg: string) => void
}) {
  const map = useMap()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const reload = useCallback(async () => {
    try {
      const bounds = map.getBounds()
      const points = await loadHeatForBounds({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      })
      onPoints(points)
    } catch {
      onError('Could not load map density data')
    }
  }, [map, onPoints, onError])

  const debouncedReload = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(reload, 400)
  }, [reload])

  useMapEvents({
    moveend: debouncedReload,
    zoomend: debouncedReload,
  })

  useEffect(() => {
    loadInitialHeat()
      .then(onPoints)
      .catch(() => onError('Could not load map density data'))
  }, [onPoints, onError])

  return null
}

export function MapView({
  onMapClick,
  placeMarkers = [],
  onPlaceClick,
  mapTarget,
}: MapViewProps) {
  const [heatPoints, setHeatPoints] = useState<HeatPoint[]>([])
  const [heatError, setHeatError] = useState<string>()

  return (
    <div className="relative w-full h-full">
      {heatError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-red-900/80 text-red-100 px-4 py-2 rounded-full text-sm backdrop-blur-sm">
          {heatError}
        </div>
      )}
      <MapContainer
        center={[30, 10]}
        zoom={3}
        className="w-full h-full"
        zoomControl={true}
        preferCanvas={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <HeatTileLoader onPoints={setHeatPoints} onError={setHeatError} />
        <HeatMarkers points={heatPoints} />
        <MapClickHandler onMapClick={onMapClick} />
        <MapFit target={mapTarget} />
        {placeMarkers.map((place) => (
          <Marker
            key={place.title}
            position={[place.lat, place.lng]}
            icon={markerIcon}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e)
                onPlaceClick?.(place.title)
              },
            }}
          >
            <Popup>
              <span className="text-sm font-medium">{place.title}</span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
