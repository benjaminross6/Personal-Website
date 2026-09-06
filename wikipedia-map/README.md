# Wikipedia Map

**Wikipedia as a place you can get lost in** — a heat map of how much has been written, a case board of what happened here, and every article as a map of the places it names.

## The loop

1. **Drop into a glowing map** — heat shows where the encyclopedia has the most to say (volume, not importance).
2. **Click a place → case board** — 3–5 scenes in different flavors (conflict, person, landmark, event, place).
3. **Open a scene → article + geography** — every geotagged place the article names, laid on the map.
4. **Click a named place → next case board** — the rabbit hole continues.
5. **Pull the time lens** — filter scenes by historical range.

Nothing is saved. The session evaporates. Tonight's hole, not a research tool.

## Run locally

From the **Personal Website** root:

```bash
npm run dev:map
```

Or from this folder:

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build for iambenross.com

From the Personal Website root:

```bash
npm run build:map
```

This builds into `../public/projects/wikipedia-map/` (served at `/projects/wikipedia-map/`).

## Data sources

- **Tiled heat map** — `public/data/heat/` loads only visible 5°×5° tiles (scales to full Wikipedia). Run `npm run build:tiles` after updating points. See [docs/scaling.md](docs/scaling.md) for full English Wikipedia pipeline.
- **Legacy fallback** — `public/data/world-heat.json` if no tile manifest
- **Scene ranking** — articles scored by distinct citation count, link richness, and size
- **IndexedDB cache** — API responses cached locally for 7 days
- [Wikipedia API](https://www.mediawiki.org/wiki/API:Main_page) — geosearch, extracts, links, coordinates (on click only)
- [OpenStreetMap](https://www.openstreetmap.org/) — map tiles

## Scene selection

Hotspots become 3–5 scenes by **flavor diversity**, not fame ranking:

- Articles near the click point are fetched via geosearch
- Each is classified by title and categories (battle, person, building, event, place)
- One scene per flavor is selected, up to 5 total
- Time range filter applies via Wikidata dates when available
