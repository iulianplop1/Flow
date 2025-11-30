// Service Worker for FlowState v2
const CACHE_NAME = 'flowstate-v2-1.0.0'
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
]

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  return self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request)
    })
  )
})

// Push notification event
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {}
  const title = data.title || 'FlowState Reminder'
  const options = {
    body: data.body || 'You have a task scheduled',
    icon: '/vite.svg',
    badge: '/vite.svg',
    tag: data.tag || 'task-reminder',
    requireInteraction: false,
    data: data.data || {},
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  )
})

