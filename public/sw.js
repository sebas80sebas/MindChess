const CACHE_NAME = "mindchess-v1";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./css/screenless.css",
  "./css/chessground.css",
  "./css/chessgroundbase.css",
  "./css/chessgroundbrown.css",
  "./js/main.js",
  "./js/modules/Accessibility.js",
  "./js/modules/ChessLogic.js",
  "./js/modules/EngineService.js",
  "./js/modules/GameController.js",
  "./js/modules/SpeechEngine.js",
  "./js/modules/Timer.js",
  "./js/modules/Tutorial.js",
  "./js/modules/UIController.js",
  "./stockfish/stockfish.js",
  "./chess.js",
  "./chessground.js",
  "./icon.png",
  "./favicon.png"
];

// Install Event: Cache assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching all assets");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event: Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cache", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Serve from cache, fall back to network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if found
      if (response) {
        return response;
      }
      
      // Otherwise fetch from network
      return fetch(event.request).catch(() => {
        // If offline and resource not cached, we could return a fallback page here
        // For now, if we miss stockfish or something critical, the app might degrade.
        // But the core assets are in ASSETS_TO_CACHE.
      });
    })
  );
});
