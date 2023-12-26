self.addEventListener('install', function(event) {
    event.waitUntil(
      caches.open('v1').then(function(cache) {
        return cache.addAll([
          'index.html',
          'flappyEi.js',
          'p5.js',
          'styles.css',
          // Fügen Sie hier weitere Assets hinzu, die gecacht werden sollen
        ]);
      })
    );
  });
  
  self.addEventListener('fetch', function(event) {
    event.respondWith(
      caches.match(event.request).then(function(response) {
        return response || fetch(event.request);
      })
    );
  });