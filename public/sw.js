const CACHE_NAME = 'deskhub-v1';
const ASSETS_TO_CACHE = [
  '/DESKHUB/',
  '/DESKHUB/index.html',
  '/DESKHUB/index.css',
  '/manifest.json'
];

// Service Worker 설치
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker 설치 중...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 자산 캐싱 중...');
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('⚠️ 일부 자산 캐싱 실패 (무시):', err);
      });
    })
  );
  self.skipWaiting();
});

// Service Worker 활성화
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker 활성화');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ 이전 캐시 제거:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 네트워크 요청 처리 (Network First 전략)
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // GET 요청만 처리
  if (request.method !== 'GET') {
    return;
  }

  // 외부 리소스는 캐시 사용
  if (
    request.url.includes('cdn.tailwindcss.com') ||
    request.url.includes('aistudiocdn.com') ||
    request.url.includes('googleapis.com') ||
    request.url.includes('sql.js.org')
  ) {
    event.respondWith(
      caches.match(request).then((response) => {
        return (
          response ||
          fetch(request)
            .then((res) => {
              const cache = caches.open(CACHE_NAME);
              cache.then((c) => c.put(request, res.clone()));
              return res;
            })
            .catch(() => {
              // 오프라인일 때 캐시된 페이지 반환
              return caches.match('/DESKHUB/');
            })
        );
      })
    );
    return;
  }

  // 앱 자산: 캐시 우선 (Cache First)
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request);
    })
  );
});

// 백그라운드 동기화 (선택사항)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // 나중에 LocalStorage 데이터 백업 로직 추가 가능
      Promise.resolve()
    );
  }
});

console.log('🚀 Service Worker 로드됨');
