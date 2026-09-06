# Scaling Wikipedia Map to full English Wikipedia

## Current architecture

The map uses **tiled static data**, not one giant JSON file:

```
public/data/heat/
  manifest.json          # tile index + counts
  tiles/
    12_2.json            # 5°×5° cell of article points
    ...
```

The client loads **only visible tiles** for the current map bounds (max ~4000 markers rendered). This keeps memory and load times bounded as the dataset grows.

Legacy fallback: if `manifest.json` is missing, the app loads `world-heat.json` monolith.

## Path to every English geotagged article

English Wikipedia has ~1–2M articles with coordinates. You cannot ship that in a single Vercel deploy (100MB limit) or load it all in the browser.

### Recommended pipeline

1. **Extract** geotagged articles from [Wikipedia dumps](https://dumps.wikimedia.org/enwiki/latest/):
   - `enwiki-latest-geo_tags.sql.gz` or parse `coordinates` from page XML
   - Output: `{ pageid, title, lat, lng }[]`

2. **Tile** with `node scripts/build-heat-tiles.mjs --input dump-points.json`
   - Produces ~2,000–5,000 tile files (5° grid)
   - Each tile typically 10KB–500KB

3. **Host tiles on CDN** (required at full scale):
   - **Cloudflare R2** / **AWS S3** + CloudFront / GitHub Releases
   - Point the app at `VITE_HEAT_DATA_URL=https://cdn.example.com/wikipedia-map/`
   - Vercel serves the app; CDN serves data (no deploy size limit)

4. **iambenross.com** embed:
   - Copy built app to `Personal Website/public/projects/wikipedia-map/`
   - Copy or symlink heat tiles to `public/projects/wikipedia-map/data/heat/` until CDN is set up
   - For full dataset, use CDN URL in production build

### Scripts

| Script | Purpose |
|--------|---------|
| `node scripts/generate-heat-data.mjs` | Quick city-based estimate (~900 points) |
| `node scripts/fetch-heat-data.mjs` | Sample Wikipedia API (rate-limited) |
| `node scripts/build-heat-tiles.mjs` | Convert any points JSON → tiles + manifest |

### Future: dump ingest script

Add `scripts/ingest-wikipedia-dump.mjs` when ready to parse official dumps offline (no API rate limits). The tile format stays the same.

## Scene selection (article quality)

Case board scenes are ranked by **interest score**:

- **Distinct citation sources** (`<ref>` count in wikitext) — primary signal
- **Link count** — proxy for geographic/topic richness
- **Article size** — filters out stubs
- **Proximity** — tie-breaker for equally rich articles

Metrics are cached in IndexedDB for 7 days per title.

## Deployment checklist (full scale)

- [ ] Generate full points JSON from Wikipedia dump
- [ ] Run `build-heat-tiles.mjs`
- [ ] Upload `data/heat/` to CDN (~500MB–2GB estimated)
- [ ] Set `VITE_HEAT_DATA_URL` in production build
- [ ] Keep Wikipedia/Wikidata API calls client-side (clicks/articles only; no server needed)
- [ ] Monitor CDN bandwidth (tiles are cacheable forever with `immutable` headers)
