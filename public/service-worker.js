// Service Worker for Offline Support
// Enables Progressive Web App (PWA) capabilities

const CACHE_NAME = 'gearbox-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip API calls (handle differently)
  if (event.request.url.includes('/api/')) {
    return handleAPIRequest(event);
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
        });
    })
  );
});

// Handle API requests with background sync
function handleAPIRequest(event) {
  event.respondWith(
    fetch(event.request)
      .then((response) => response)
      .catch(() => {
        // Queue for background sync if offline
        if (event.request.method === 'POST' || event.request.method === 'PUT') {
          return queueForSync(event.request);
        }
        
        // Return cached data if available
        return caches.match(event.request);
      })
  );
}

// Queue failed requests for background sync
async function queueForSync(request) {
  const requestData = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: await request.text(),
    timestamp: Date.now(),
  };

  // Store in IndexedDB
  const db = await openDB();
  const tx = db.transaction('sync-queue', 'readwrite');
  await tx.objectStore('sync-queue').add(requestData);

  // Register background sync
  if ('sync' in self.registration) {
    await self.registration.sync.register('sync-queue');
  }

  return new Response(
    JSON.stringify({ queued: true, message: 'Request queued for sync' }),
    { status: 202, headers: { 'Content-Type': 'application/json' } }
  );
}

// Background sync event
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-queue') {
    event.waitUntil(processSyncQueue());
  }
});

// Process queued requests
async function processSyncQueue() {
  const db = await openDB();
  const tx = db.transaction('sync-queue', 'readonly');
  const queue = await tx.objectStore('sync-queue').getAll();

  for (const item of queue) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
      });

      if (response.ok) {
        // Remove from queue
        const deleteTx = db.transaction('sync-queue', 'readwrite');
        await deleteTx.objectStore('sync-queue').delete(item.id);
      }
    } catch (error) {
      console.error('[SW] Sync failed:', error);
    }
  }
}

// IndexedDB helper
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('gearbox-offline', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('sync-queue')) {
        db.createObjectStore('sync-queue', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// Push notification event
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};

  const options = {
    body: data.body || 'New notification from Gearbox',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [200, 100, 200],
    data: data.url || '/',
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'close', title: 'Close' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Gearbox', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data || '/')
    );
  }
});

console.log('[SW] Service Worker loaded');
