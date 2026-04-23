/**
 * SkillForge Turbo Engine (v1.2.1)
 * Zero-Refresh Navigation (PJAX) with Full Page Hydration
 * Optimized for Dashboard Persistence & Content Reliability
 */

class SkillForgeTurbo {
    constructor() {
        if (window._sfTurboInstance) {
            console.log("[Turbo] Engine already running, skipping duplicate.");
            return;
        }
        this.cache = new Map();
        this.isNavigating = false;
        this.currentController = null;
        window._sfTurboInstance = this;
        this.init();
    }

    init() {
        // Intercept clicks on internal links
        document.addEventListener('click', (e) => {
            const link = /** @type {HTMLAnchorElement} */ (e.target.closest('a'));
            if (!link || link.hasAttribute('data-turbo-ignore')) return;

            const url = new URL(link.href, window.location.origin);
            if (url.origin !== window.location.origin) return;
            
            // Only apply Turbo navigation to /trainee-dashboard/ and its sub-pages
            if (!url.pathname.startsWith('/trainee-dashboard/')) return;

            // Skip downloads, hash links, external targets, or non-html links
            if (link.hasAttribute('download') || url.hash || link.target === '_blank') return;
            
            // Normalize paths for comparison
            const normalize = (path) => path.replace(/\/index\.html$/, '').replace(/\/$/, '') || '/';
            const currentPath = normalize(window.location.pathname);
            const targetPath = normalize(url.pathname);
            
            if (currentPath === targetPath) {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            e.preventDefault();
            this.navigate(url.pathname + url.search + url.hash);
        });

        // Handle browser back/forward navigation
        window.addEventListener('popstate', (e) => {
            this.navigate(window.location.pathname + window.location.search + window.location.hash, false);
        });

        console.log("[Turbo] Engine Initialized & Monitoring System Links");
    }

    async navigate(url, pushState = true) {
        if (this.isNavigating) return;
        this.isNavigating = true;

        console.log(`[Turbo] Syncing Path: ${url}`);
        this.showProgressBar();

        try {
            if (this.currentController) this.currentController.abort();
            this.currentController = new AbortController();

            const res = await fetch(url, {
                signal: this.currentController.signal,
                headers: { 'X-Requested-With': 'SkillForge-Turbo' }
            });
            
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            
            const html = await res.text();
            const parser = new DOMParser();
            const newDoc = parser.parseFromString(html, 'text/html');
            
            // Prepare for transition
            window.dispatchEvent(new CustomEvent('sf:turbo-before-render'));

            // 1. Update Metadata
            document.title = newDoc.title;

            // 2. Intelligent Content Swap
            const oldMain = document.querySelector('main');
            const newMain = newDoc.querySelector('main');
            const oldSidebar = document.querySelector('aside#main-sidebar');
            const newSidebar = newDoc.querySelector('aside#main-sidebar');

            if (newMain && oldMain) {
                oldMain.innerHTML = newMain.innerHTML;
                // Sync main attributes (like track/lesson IDs)
                Array.from(newMain.attributes).forEach(attr => oldMain.setAttribute(attr.name, attr.value));
            } else {
                document.body.innerHTML = newDoc.body.innerHTML;
                document.body.className = newDoc.body.className;
            }

            // 3. Update Sidebar Active State
            if (newSidebar && oldSidebar) {
                const newLinks = newSidebar.querySelectorAll('a');
                const oldLinks = oldSidebar.querySelectorAll('a');
                
                oldLinks.forEach((link, idx) => {
                    const newLink = newLinks[idx];
                    if (newLink && link) {
                        link.className = newLink.className;
                        const parent = link.parentElement;
                        const newParent = newLink.parentElement;
                        if (parent && newParent) parent.className = newParent.className;
                    }
                });
            }

            // 4. Update URL
            if (pushState) window.history.pushState({}, '', url);

            // 5. Finalize Transition & Re-hydrate
            this.hideProgressBar();
            
            // Re-hydrate Lucide icons and other essential UI
            if (window.lucide) window.lucide.createIcons();
            
            // Global Re-hydration for external scripts
            window.dispatchEvent(new CustomEvent('sf:turbo-render', { detail: { url } }));
            window.dispatchEvent(new CustomEvent('sf:turbo-after-render', { detail: { url } }));
            
            // Call sfCore sync if available (prevents duplicate init but syncs state)
            if (/** @type {any} */(window).sfCore) {
                /** @type {any} */(window).sfCore.syncRegistryState();
            }

            window.scrollTo({ top: 0, behavior: 'auto' });
            console.log(`[Turbo] Transition Complete: ${url}`);
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.error("[Turbo] Navigation Failed. Refreshing context...", err);
            window.location.href = url; // Fallback to standard navigation
        } finally {
            this.isNavigating = false;
        }
    }

    showProgressBar() {
        let bar = document.getElementById('sf-turbo-progress');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'sf-turbo-progress';
            bar.style.cssText = 'position: fixed; top: 0; left: 0; height: 2px; background: #f59e0b; z-index: 9999; transition: width 0.3s ease; width: 0;';
            document.body.appendChild(bar);
        }
        bar.style.width = '30%';
        setTimeout(() => { if (this.isNavigating) bar.style.width = '70%'; }, 200);
    }

    hideProgressBar() {
        const bar = document.getElementById('sf-turbo-progress');
        if (bar) {
            bar.style.width = '100%';
            setTimeout(() => { bar.style.width = '0'; }, 300);
        }
    }
}

// Initialize
new SkillForgeTurbo();
