/**
 * Generates world-heat.json from major city coordinates.
 * Run once: node scripts/generate-heat-data.mjs
 * Re-run periodically to refresh, or use scripts/fetch-heat-data.mjs
 * with Wikipedia API when you have API access.
 */

import { writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Wikipedia density proxy: larger cities = more geotagged articles
const CITIES = [
  { name: 'London', lat: 51.5074, lng: -0.1278, weight: 1.0 },
  { name: 'Paris', lat: 48.8566, lng: 2.3522, weight: 1.0 },
  { name: 'New York', lat: 40.7128, lng: -74.006, weight: 1.0 },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503, weight: 1.0 },
  { name: 'Beijing', lat: 39.9042, lng: 116.4074, weight: 0.95 },
  { name: 'Moscow', lat: 55.7558, lng: 37.6173, weight: 0.9 },
  { name: 'Berlin', lat: 52.52, lng: 13.405, weight: 0.85 },
  { name: 'Rome', lat: 41.9028, lng: 12.4964, weight: 0.9 },
  { name: 'Madrid', lat: 40.4168, lng: -3.7038, weight: 0.8 },
  { name: 'Cairo', lat: 30.0444, lng: 31.2357, weight: 0.85 },
  { name: 'Istanbul', lat: 41.0082, lng: 28.9784, weight: 0.85 },
  { name: 'Delhi', lat: 28.6139, lng: 77.209, weight: 0.9 },
  { name: 'Mumbai', lat: 19.076, lng: 72.8777, weight: 0.8 },
  { name: 'São Paulo', lat: -23.5505, lng: -46.6333, weight: 0.75 },
  { name: 'Mexico City', lat: 19.4326, lng: -99.1332, weight: 0.8 },
  { name: 'Los Angeles', lat: 34.0522, lng: -118.2437, weight: 0.85 },
  { name: 'Chicago', lat: 41.8781, lng: -87.6298, weight: 0.75 },
  { name: 'Washington DC', lat: 38.9072, lng: -77.0369, weight: 0.85 },
  { name: 'Philadelphia', lat: 39.9526, lng: -75.1652, weight: 0.7 },
  { name: 'Boston', lat: 42.3601, lng: -71.0589, weight: 0.75 },
  { name: 'San Francisco', lat: 37.7749, lng: -122.4194, weight: 0.7 },
  { name: 'Toronto', lat: 43.6532, lng: -79.3832, weight: 0.7 },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093, weight: 0.75 },
  { name: 'Melbourne', lat: -37.8136, lng: 144.9631, weight: 0.65 },
  { name: 'Vienna', lat: 48.2082, lng: 16.3738, weight: 0.75 },
  { name: 'Prague', lat: 50.0755, lng: 14.4378, weight: 0.7 },
  { name: 'Warsaw', lat: 52.2297, lng: 21.0122, weight: 0.65 },
  { name: 'Athens', lat: 37.9838, lng: 23.7275, weight: 0.75 },
  { name: 'Jerusalem', lat: 31.7683, lng: 35.2137, weight: 0.85 },
  { name: 'Baghdad', lat: 33.3152, lng: 44.3661, weight: 0.7 },
  { name: 'Tehran', lat: 35.6892, lng: 51.389, weight: 0.65 },
  { name: 'Seoul', lat: 37.5665, lng: 126.978, weight: 0.8 },
  { name: 'Shanghai', lat: 31.2304, lng: 121.4737, weight: 0.85 },
  { name: 'Hong Kong', lat: 22.3193, lng: 114.1694, weight: 0.75 },
  { name: 'Bangkok', lat: 13.7563, lng: 100.5018, weight: 0.7 },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198, weight: 0.65 },
  { name: 'Jakarta', lat: -6.2088, lng: 106.8456, weight: 0.65 },
  { name: 'Manila', lat: 14.5995, lng: 120.9842, weight: 0.6 },
  { name: 'Buenos Aires', lat: -34.6037, lng: -58.3816, weight: 0.7 },
  { name: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729, weight: 0.7 },
  { name: 'Lima', lat: -12.0464, lng: -77.0428, weight: 0.55 },
  { name: 'Bogotá', lat: 4.711, lng: -74.0721, weight: 0.55 },
  { name: 'Lagos', lat: 6.5244, lng: 3.3792, weight: 0.6 },
  { name: 'Nairobi', lat: -1.2921, lng: 36.8219, weight: 0.55 },
  { name: 'Johannesburg', lat: -26.2041, lng: 28.0473, weight: 0.55 },
  { name: 'Casablanca', lat: 33.5731, lng: -7.5898, weight: 0.5 },
  { name: 'Algiers', lat: 36.7538, lng: 3.0588, weight: 0.5 },
  { name: 'Dublin', lat: 53.3498, lng: -6.2603, weight: 0.65 },
  { name: 'Edinburgh', lat: 55.9533, lng: -3.1883, weight: 0.6 },
  { name: 'Amsterdam', lat: 52.3676, lng: 4.9041, weight: 0.7 },
  { name: 'Brussels', lat: 50.8503, lng: 4.3517, weight: 0.6 },
  { name: 'Copenhagen', lat: 55.6761, lng: 12.5683, weight: 0.6 },
  { name: 'Stockholm', lat: 59.3293, lng: 18.0686, weight: 0.6 },
  { name: 'Oslo', lat: 59.9139, lng: 10.7522, weight: 0.55 },
  { name: 'Helsinki', lat: 60.1699, lng: 24.9384, weight: 0.55 },
  { name: 'Budapest', lat: 47.4979, lng: 19.0402, weight: 0.65 },
  { name: 'Bucharest', lat: 44.4268, lng: 26.1025, weight: 0.5 },
  { name: 'Kyiv', lat: 50.4501, lng: 30.5234, weight: 0.65 },
  { name: 'St Petersburg', lat: 59.9311, lng: 30.3609, weight: 0.7 },
  { name: 'Florence', lat: 43.7696, lng: 11.2558, weight: 0.75 },
  { name: 'Venice', lat: 45.4408, lng: 12.3155, weight: 0.7 },
  { name: 'Naples', lat: 40.8518, lng: 14.2681, weight: 0.65 },
  { name: 'Barcelona', lat: 41.3874, lng: 2.1686, weight: 0.7 },
  { name: 'Lisbon', lat: 38.7223, lng: -9.1393, weight: 0.65 },
  { name: 'Porto', lat: 41.1579, lng: -8.6291, weight: 0.55 },
  { name: 'Munich', lat: 48.1351, lng: 11.582, weight: 0.65 },
  { name: 'Hamburg', lat: 53.5511, lng: 9.9937, weight: 0.6 },
  { name: 'Cologne', lat: 50.9375, lng: 6.9603, weight: 0.55 },
  { name: 'Normandy', lat: 49.1829, lng: -0.3707, weight: 0.7 },
  { name: 'Waterloo', lat: 50.7147, lng: 4.3991, weight: 0.6 },
  { name: 'Versailles', lat: 48.8014, lng: 2.1301, weight: 0.65 },
  { name: 'Gettysburg', lat: 39.8309, lng: -77.2311, weight: 0.65 },
  { name: 'Pearl Harbor', lat: 21.3644, lng: -157.9504, weight: 0.6 },
  { name: 'Hiroshima', lat: 34.3853, lng: 132.4553, weight: 0.65 },
  { name: 'Nagasaki', lat: 32.7503, lng: 129.8779, weight: 0.6 },
  { name: 'Pompeii', lat: 40.7489, lng: 14.4842, weight: 0.65 },
  { name: 'Alexandria', lat: 31.2001, lng: 29.9187, weight: 0.7 },
  { name: 'Luxor', lat: 25.6872, lng: 32.6396, weight: 0.65 },
  { name: 'Petra', lat: 30.3285, lng: 35.4444, weight: 0.6 },
  { name: 'Mecca', lat: 21.4225, lng: 39.8262, weight: 0.65 },
  { name: 'Samarkand', lat: 39.6542, lng: 66.9597, weight: 0.6 },
  { name: 'Delhi Red Fort', lat: 28.6562, lng: 77.241, weight: 0.65 },
  { name: 'Agra', lat: 27.1767, lng: 78.0081, weight: 0.65 },
  { name: 'Kyoto', lat: 35.0116, lng: 135.7681, weight: 0.7 },
  { name: 'Osaka', lat: 34.6937, lng: 135.5023, weight: 0.65 },
  { name: 'Hanoi', lat: 21.0285, lng: 105.8542, weight: 0.55 },
  { name: 'Ho Chi Minh City', lat: 10.8231, lng: 106.6297, weight: 0.55 },
  { name: 'Phnom Penh', lat: 11.5564, lng: 104.9282, weight: 0.5 },
  { name: 'Angkor Wat', lat: 13.4125, lng: 103.867, weight: 0.65 },
  { name: 'Machu Picchu', lat: -13.1631, lng: -72.545, weight: 0.65 },
  { name: 'Cusco', lat: -13.532, lng: -71.9675, weight: 0.6 },
  { name: 'Tenochtitlan', lat: 19.4326, lng: -99.1332, weight: 0.6 },
  { name: 'Chichen Itza', lat: 20.6843, lng: -88.5678, weight: 0.6 },
  { name: 'Quebec City', lat: 46.8139, lng: -71.208, weight: 0.55 },
  { name: 'Montreal', lat: 45.5017, lng: -73.5673, weight: 0.6 },
  { name: 'New Orleans', lat: 29.9511, lng: -90.0715, weight: 0.65 },
  { name: 'Charleston', lat: 32.7765, lng: -79.9311, weight: 0.55 },
  { name: 'Savannah', lat: 32.0809, lng: -81.0912, weight: 0.5 },
  { name: 'Denver', lat: 39.7392, lng: -104.9903, weight: 0.5 },
  { name: 'Seattle', lat: 47.6062, lng: -122.3321, weight: 0.6 },
  { name: 'Portland', lat: 45.5152, lng: -122.6784, weight: 0.5 },
  { name: 'Anchorage', lat: 61.2181, lng: -149.9003, weight: 0.45 },
  { name: 'Honolulu', lat: 21.3069, lng: -157.8583, weight: 0.55 },
  { name: 'Reykjavik', lat: 64.1466, lng: -21.9426, weight: 0.5 },
  { name: 'Timbuktu', lat: 16.7666, lng: -3.0026, weight: 0.55 },
  { name: 'Great Zimbabwe', lat: -20.2675, lng: 30.9333, weight: 0.5 },
  { name: 'Addis Ababa', lat: 9.032, lng: 38.7469, weight: 0.5 },
  { name: 'Zanzibar', lat: -6.1659, lng: 39.2026, weight: 0.5 },
]

function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

const points = []
let seed = 42

for (const city of CITIES) {
  const rand = seededRandom(seed++)
  points.push({
    lat: city.lat,
    lng: city.lng,
    intensity: city.weight,
    title: city.name,
  })

  const scatterCount = Math.floor(city.weight * 12)
  for (let i = 0; i < scatterCount; i++) {
    const angle = rand() * Math.PI * 2
    const dist = rand() * 1.5 * city.weight
    points.push({
      lat: city.lat + Math.cos(angle) * dist,
      lng: city.lng + Math.sin(angle) * dist * 1.3,
      intensity: 0.2 + rand() * city.weight * 0.6,
      title: city.name,
    })
  }
}

const outDir = join(__dirname, '..', 'public', 'data')
mkdirSync(outDir, { recursive: true })
const outPath = join(outDir, 'world-heat.json')
writeFileSync(outPath, JSON.stringify({ generated: new Date().toISOString(), points }))
console.log(`Wrote ${points.length} heat points to ${outPath}`)
