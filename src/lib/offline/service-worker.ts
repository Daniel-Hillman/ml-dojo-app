// Enhanced service worker for offline capability

const CACHE_NAME = 'omnicode-v1';
const STATIC_CACHE = 'omnicode-static-v1';
const DYNAMIC_CACHE = 'omnicode-dynamic-v1';
const CODE_CACHE = 'omnicode-code-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/playground',
  '/drills',
  '/learn',
  '/community',
  '/offline.html',
  '/manifest.json',
  // Add critical CSS and JS files
  '/_next/static/css/',
  '/_next/static/js/',
  // Add fonts
  '/fonts/',
];

// API endpoints to cache
const CACHEABLE_APIS = [
  '/api/drills',
  '/api/templates',
  '/api/user-preferences',
];

// Install event - cache static assets
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        return cache.addAll(STATIC_ASSETS);
      }),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== CODE_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else if (url.pathname.includes('/_next/static/')) {
    event.respondWith(handleStaticAssets(request));
  } else if (url.pathname.startsWith('/code-execution/')) {
    event.respondWith(handleCodeExecution(request));
  } else {
    event.respondWith(handlePageRequest(request));
  }
});

// Handle API requests with network-first strategy
async function handleApiRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok && CACHEABLE_APIS.some(api => url.pathname.startsWith(api))) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for specific endpoints
    if (url.pathname.startsWith('/api/drills')) {
      return new Response(JSON.stringify({
        drills: [],
        offline: true,
        message: 'You are offline. Showing cached content.'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw error;
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAssets(request: Request): Promise<Response> {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    // Return a fallback for critical assets
    return new Response('/* Offline fallback */', {
      headers: { 'Content-Type': 'text/css' }
    });
  }
}

// Handle code execution requests
async function handleCodeExecution(request: Request): Promise<Response> {
  try {
    // Always try network for code execution
    return await fetch(request);
  } catch (error) {
    // Return offline message for code execution
    return new Response(JSON.stringify({
      success: false,
      error: 'Code execution is not available offline',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle page requests with stale-while-revalidate strategy
async function handlePageRequest(request: Request): Promise<Response> {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then(networkResponse => {
    // Update cache in background
    if (networkResponse.ok) {
      const cache = caches.open(DYNAMIC_CACHE);
      cache.then(c => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  }).catch(() => {
    // If network fails and we have no cache, show offline page
    if (!cachedResponse) {
      return caches.match('/offline.html');
    }
    throw new Error('Network failed');
  });
  
  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Otherwise wait for network
  return fetchPromise;
}

// Background sync for offline actions
self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineActions());
  }
});

async function syncOfflineActions() {
  // Get offline actions from IndexedDB
  const offlineActions = await getOfflineActions();
  
  for (const action of offlineActions) {
    try {
      await processOfflineAction(action);
      await removeOfflineAction(action.id);
    } catch (error) {
      console.error('Failed to sync offline action:', error);
    }
  }
}

async function getOfflineActions(): Promise<any[]> {
  // Implementation would use IndexedDB to store offline actions
  return [];
}

async function processOfflineAction(action: any): Promise<void> {
  // Process different types of offline actions
  switch (action.type) {
    case 'create-drill':
      await fetch('/api/drills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.data)
      });
      break;
    case 'save-code':
      await fetch('/api/code-snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.data)
      });
      break;
    // Add more action types as needed
  }
}

async function removeOfflineAction(id: string): Promise<void> {
  // Remove from IndexedDB
}

// Push notifications for updates
self.addEventListener('push', (event: PushEvent) => {
  const options = {
    body: event.data?.text() || 'New content available!',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('OmniCode Update', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});

// Message handling for communication with main thread
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    event.ports[0].postMessage({
      caches: [STATIC_CACHE, DYNAMIC_CACHE, CODE_CACHE],
      offline: !navigator.onLine
    });
  }
});

export {};