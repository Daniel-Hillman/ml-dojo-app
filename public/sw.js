// Service Worker for Code Execution System
// Provides offline capabilities and performance optimizations

const CACHE_NAME = 'omnicode-v1';
const OFFLINE_URL = '/offline.html';

// Resources to cache for offline use
const CACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  // Add critical CSS and JS files
  // Note: In production, these would be the actual built assets
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching critical resources');
        return cache.addAll(CACHE_URLS);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Ensure the service worker takes control immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.open(CACHE_NAME)
            .then((cache) => {
              return cache.match(OFFLINE_URL);
            });
        })
    );
    return;
  }

  // Handle other requests with cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response for caching
            const responseToCache = response.clone();

            // Cache the response for future use
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // If both cache and network fail, return offline page for navigation
            if (event.request.destination === 'document') {
              return caches.match(OFFLINE_URL);
            }
          });
      })
  );
});

// Background sync for code execution results
self.addEventListener('sync', (event) => {
  if (event.tag === 'code-execution-sync') {
    event.waitUntil(syncCodeExecutions());
  }
});

// Handle background sync for code executions
async function syncCodeExecutions() {
  try {
    // Get pending executions from IndexedDB
    const pendingExecutions = await getPendingExecutions();
    
    for (const execution of pendingExecutions) {
      try {
        // Attempt to sync with server
        const response = await fetch('/api/code-execution/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(execution)
        });

        if (response.ok) {
          // Remove from pending list
          await removePendingExecution(execution.id);
        }
      } catch (error) {
        console.log('Failed to sync execution:', execution.id, error);
      }
    }
  } catch (error) {
    console.log('Background sync failed:', error);
  }
}

// Helper functions for IndexedDB operations
async function getPendingExecutions() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('omnicode-offline', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pending-executions'], 'readonly');
      const store = transaction.objectStore('pending-executions');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('pending-executions')) {
        db.createObjectStore('pending-executions', { keyPath: 'id' });
      }
    };
  });
}

async function removePendingExecution(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('omnicode-offline', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pending-executions'], 'readwrite');
      const store = transaction.objectStore('pending-executions');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: data.tag || 'default',
    data: data.data || {},
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action) {
    // Handle action button clicks
    handleNotificationAction(event.action, event.notification.data);
  } else {
    // Handle notification click
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

function handleNotificationAction(action, data) {
  switch (action) {
    case 'view':
      clients.openWindow(data.url || '/');
      break;
    case 'dismiss':
      // Just close the notification
      break;
    default:
      clients.openWindow('/');
  }
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'code-cache-cleanup') {
    event.waitUntil(cleanupCodeCache());
  }
});

async function cleanupCodeCache() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    
    // Remove old cached code executions (older than 1 hour)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    for (const request of requests) {
      if (request.url.includes('/api/code-execution/')) {
        const response = await cache.match(request);
        if (response) {
          const dateHeader = response.headers.get('date');
          if (dateHeader && new Date(dateHeader).getTime() < oneHourAgo) {
            await cache.delete(request);
          }
        }
      }
    }
  } catch (error) {
    console.log('Cache cleanup failed:', error);
  }
}

console.log('Service Worker loaded successfully');