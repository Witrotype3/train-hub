
let routes = []
let appEl = null

export function setRoutes(r, el) {
    routes = r
    appEl = el
}

export function findRoute(urlPath) {
    if (!urlPath || urlPath === '') urlPath = '/'

    // Try exact match first
    const exactMatch = routes.find(r => r.path === urlPath)
    if (exactMatch) return exactMatch

    // For prefix matching, check longer paths first (like /training/modules vs /training)
    const sortedRoutes = [...routes].sort((a, b) => b.path.length - a.path.length)
    const prefixMatch = sortedRoutes.find(r => urlPath.startsWith(r.path) && r.path !== '/')
    if (prefixMatch) return prefixMatch

    // Fallback to home
    return routes[0]
}

export async function onRoute() {
    // If there's a legacy hash, convert it to a path and redirect
    if (location.hash && location.hash.startsWith('#/')) {
        const path = location.hash.substring(1)
        history.replaceState(null, '', path)
    }

    const path = location.pathname
    const r = findRoute(path)

    if (appEl && r) {
        appEl.innerHTML = '' // Clear existing content before rendering new route
        try {
            await r.render(appEl)
        } catch (e) {
            console.error('Route rendering error:', e)
            appEl.innerHTML = '<div class="card"><h2>Error</h2><pre>' + String(e) + '</pre></div>'
        }
    }

    // Dispatch a custom event so other components (like nav) can update
    window.dispatchEvent(new CustomEvent('route-changed', { detail: { path } }))
}

export function navigate(path, force = false) {
    if (location.pathname === path && !force) return
    if (location.pathname !== path) {
        history.pushState(null, '', path)
    }
    onRoute()
}

// Global link interceptor for SPA navigation
document.addEventListener('click', (e) => {
    const link = e.target.closest('a')
    if (link && link.href && link.href.startsWith(location.origin)) {
        // Only intercept internal links that don't have target="_blank"
        if (!link.hasAttribute('target') || link.target !== '_blank') {
            e.preventDefault()
            const path = link.href.replace(location.origin, '')
            navigate(path)
        }
    }
})

window.addEventListener('popstate', onRoute)
