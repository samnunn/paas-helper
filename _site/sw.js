let version = "7"

let cacheName = `v${version}_data`

let cachedAssetPaths = [
    './',
    'index.html',
    'main.css',
    'main.js',
    'chevrons-down.svg',
    'oplist.json',
    'favicon.ico',
    'beagle.js',
    'brightspot.js',
    'fuzzysort.min.js',
]

// install (pre-activation) event
    // waitUntil() accepts a Promise and *waits* for it to resolve
    // alt title: waitForResolutionOfThisPromise(<Promise>)
async function install() {
    console.debug(`SW ${version}: installing`)

    let cache = await caches.open(cacheName)

    for (let p of cachedAssetPaths) {
        try {
            await cache.add(p)
            console.debug(`SW ${version}: pre-downloaded asset @ ${p}`)
        } catch ({name, message}) {
            console.error(`SW ${version}: failed to pre-download asset @ ${p}`)
        } finally {
            continue
        }
    }

    self.skipWaiting()
}
self.addEventListener('install', event => {
    event.waitUntil(install())
})

// activation (post-installation) event
async function activate() {
    console.debug(`SW ${version}: activating`)
    let allCaches = await caches.keys()
    let badCaches = allCaches.filter((key) => { return key != cacheName })
    for (let c of badCaches) {
        caches.delete(c)
    }
    await self.clients.claim()
}
self.addEventListener('activate', (e) => {
    e.waitUntil(activate())
})

// fetch (every request)
self.addEventListener('fetch', async (e) => {
    // https://stackoverflow.com/a/49719964
    // via https://gomakethings.com/toolkit/boilerplates/service-worker/
    if (e.request.cache === 'only-if-cached' && e.request.mode !== 'same-origin') return;

    e.respondWith(cacheBeforeNetwork(e.request))
})

// matching methods
async function cacheBeforeNetwork(request) {
    console.debug(`SW ${version}: running cacheBeforeNetwork for ${request.url}`)

    // match and return
    let match = await caches.match(request)
    if (match) {
        console.debug(`SW ${version}: ${request.url} served from cache 💾`)
        return match
    }
    // fall back to network
    console.debug(`SW ${version}: ${request.url} served from network 🛜`)
    return await fetch(request)
}