/**
 * SkillForge Turbo Engine (v1.1.0)
 * Zero-Refresh MPA Transitions (PJAX)
 */

class SkillForgeTurbo {
    constructor() {
        this.cache = new Map();
        this.isNavigating = false;
        this.init();
    }

    init() {
        // Listen for all clicks on the document
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link) return;

            // Only intercept internal links
            const url = new URL(link.href);
            if (url.origin !== window.location.origin) return;
            
            // Skip actual file downloads, hash links, or external targets
            if (link.hasAttribute('download') || url.hash || link.target === '_blank') return;
            
            // Handle root navigation properly
            const currentPath = window.location.pathname;
            const targetPath = url.pathname;
            if (currentPath === targetPath) return;

            e.preventDefault();
            this.navigate(url.href);
        });

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.url) {
                this.navigate(e.state.url, false);
            }
        });

        // Store initial state
        window.history.replaceState({ url: window.location.href }, '', window.location.href);
        this.registerServiceWorker();
        console.log("[Turbo] Engine Initialized");
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(reg => console.log('[OfflineMatrix] Sync Active:', reg.scope))
                    .catch(err => console.error('[OfflineMatrix] Registry Sync Failed:', err));
            });
        }
    }

    async navigate(url, pushState = true) {
        if (this.isNavigating) return;
        this.isNavigating = true;

        console.log(`[Turbo] Navigating to: ${url}`);
        this.showProgressBar();

        try {
            const html = await this.fetchPage(url);
            const parser = new DOMParser();
            const newDoc = parser.parseFromString(html, 'text/html');

            // 1. Update Title
            document.title = newDoc.title;

            // 2. Swap Main Content
            const newMain = newDoc.querySelector('main') || newDoc.body;
            const currentMain = document.querySelector('main') || document.body;

            // Fade out
            currentMain.style.opacity = '0';
            currentMain.style.transform = 'translateY(10px)';
            
            setTimeout(() => {
                // Update URL
                if (pushState) window.history.pushState({ url }, '', url);

                // Replace content
                currentMain.innerHTML = newMain.innerHTML;
                
                // Copy classes from new body to current body
                document.body.className = newDoc.body.className;

                // 3. Re-run Scripts in the new content
                this.executeScripts(currentMain);

                // 4. Notify components (ThemeManager, Core, etc.)
                window.dispatchEvent(new CustomEvent('turbo:load', { detail: { url } }));

                // Fade in
                currentMain.style.opacity = '1';
                currentMain.style.transform = 'translateY(0)';
                this.hideProgressBar();
                this.isNavigating = false;
                
                // Scroll to top
                window.scrollTo(0, 0);
            }, 300);

        } catch (err) {
            console.error("[Turbo] Navigation Failed, falling back to hard refresh:", err);
            window.location.href = url;
        }
    }

    async fetchPage(url) {
        // Clear cache for registry-heavy pages to ensure fresh data
        if (url.includes('dashboard') || url.includes('vault') || url.includes('leaderboard')) {
            this.cache.delete(url);
        }

        if (this.cache.has(url)) return this.cache.get(url);
        
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const html = await res.text();
        this.cache.set(url, html);
        return html;
    }

    executeScripts(container) {
        const scripts = container.querySelectorAll('script');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
            });
            newScript.appendChild(document.createTextNode(oldScript.innerHTML));
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    }

    showProgressBar() {
        let bar = document.getElementById('turbo-progress');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'turbo-progress';
            bar.style.cssText = `
                position: fixed; top: 0; left: 0; height: 2px; 
                background: #f59e0b; z-index: 9999; transition: width 0.3s ease;
                box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
            `;
            document.body.appendChild(bar);
        }
        bar.style.width = '0%';
        setTimeout(() => bar.style.width = '70%', 10);
    }

    hideProgressBar() {
        const bar = document.getElementById('turbo-progress');
        if (bar) {
            bar.style.width = '100%';
            setTimeout(() => {
                bar.style.width = '0%';
            }, 300);
        }
    }
}

export const turbo = new SkillForgeTurbo();
window.sfTurbo = turbo;
