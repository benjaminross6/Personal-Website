const DB_NAME = 'wikipedia-map-cache'
const DB_VERSION = 1
const STORE = 'api-cache'
const TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

interface CacheEntry<T> {
  key: string
  value: T
  expires: number
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE, { keyPath: 'key' })
    }
  })
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openDb()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(key)
      req.onsuccess = () => {
        const entry = req.result as CacheEntry<T> | undefined
        if (!entry || entry.expires < Date.now()) {
          resolve(null)
        } else {
          resolve(entry.value)
        }
      }
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

export async function cacheSet<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openDb()
    const entry: CacheEntry<T> = {
      key,
      value,
      expires: Date.now() + TTL_MS,
    }
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(entry)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  } catch {
    // Cache write failure is non-fatal
  }
}

export function cacheKey(type: string, ...parts: (string | number)[]): string {
  return `${type}:${parts.map(String).join(':')}`
}
