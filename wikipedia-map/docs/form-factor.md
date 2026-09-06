# Form factor decision

**Chosen: Website (Vite + React SPA)**

## Why a website

- The core experience is a **full-screen map** — browsers are the natural home for this.
- No install friction: drop a link, start exploring.
- Deployable to your existing site as a static build (`npm run build` → upload `dist/`).
- Wikipedia API calls work directly from the browser in production (CORS-enabled).

## What we built

| Direction | How |
|-----------|-----|
| Map → Wikipedia | Click the map → case board → article → places on map |
| Wikipedia → Map | "Start from article" button → enter a title → places explode onto map |

## Future options

- **Browser extension**: Inject a "View on map" button into Wikipedia article pages. Same backend logic, different entry point.
- **Native app**: Only if offline maps or push notifications become important — not needed for v1.

## Deploy to your site

```bash
npm run build
# Copy dist/ to your web host, or:
npm run preview  # test production build locally
```

The production build calls Wikipedia and Wikidata APIs directly from the user's browser. The dev server uses a Vite proxy (`/api/wiki`, `/api/wikidata`) to avoid rate-limit issues during development.
