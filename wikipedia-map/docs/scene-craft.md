# Scene selection

How a hotspot becomes 3–5 scenes on the case board.

## Goal

Not the five most famous articles. **Different flavors** from the volume pile — doors, not a bibliography.

## Algorithm

1. **Fetch volume** — Wikipedia geosearch near the click point (up to 50 articles).
2. **Classify by title** — regex heuristics assign each article a flavor:
   - Conflict (battle, war, siege…)
   - Event (revolution, disaster, ceremony…)
   - Person (politician, emperor, writer…)
   - Landmark (church, castle, museum…)
   - Place (city, river, region…)
   - Story (everything else)
3. **Pick one per flavor** — highest proximity score within each flavor, up to 5 total.
4. **Minimum 3** — if fewer than 3 flavors match, fill from remaining articles by proximity.
5. **Batch enrich** — one API call for all extracts, one for Wikidata years (only for picked scenes).
6. **Time filter** — if the range excludes dated scenes, fall back to unfiltered if fewer than 2 remain.

## Why title heuristics, not categories

Fetching categories for 30 articles caused Wikipedia rate limits (429). Title patterns capture most of the variety at zero extra API cost. Categories could be added later for edge cases.

## Proximity score

```
score = 1 / (distance_meters + 1)
```

Closer articles rank higher within their flavor bucket.

## Example: click Paris

| Flavor | Example scene |
|--------|---------------|
| Event | 2024 Summer Olympics opening ceremony |
| Place | Paris |
| Landmark | Autonomous Port of Paris |
| Story | International Federation of Film Archives |
| Conflict | (if any battle article is nearby) |

The user sees variety, not five articles about the same city.
