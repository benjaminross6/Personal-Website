export interface GeoArticle {
  pageid: number
  title: string
  lat: number
  lng: number
  dist: number
}

export interface Scene {
  title: string
  pageid: number
  lat: number
  lng: number
  flavor: SceneFlavor
  excerpt: string
  year?: number
  sourceCount?: number
  linkCount?: number
}

export type SceneFlavor =
  | 'battle'
  | 'person'
  | 'building'
  | 'event'
  | 'place'
  | 'other'

export interface PlaceMention {
  title: string
  lat: number
  lng: number
}

export interface ArticleDetail {
  title: string
  pageid: number
  extract: string
  wikiUrl: string
  places: PlaceMention[]
}

export interface TimeRange {
  start: number
  end: number
}

export type MapTarget =
  | { kind: 'point'; lat: number; lng: number }
  | { kind: 'places'; points: Array<{ lat: number; lng: number }> }

export interface HeatPoint {
  lat: number
  lng: number
  intensity: number
  title?: string
}

export type AppView =
  | { mode: 'map' }
  | { mode: 'caseboard'; lat: number; lng: number; placeName?: string }
  | { mode: 'article'; title: string; returnTo: AppView }
