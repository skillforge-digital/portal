/**
 * SkillForge Turbo Engine (v1.2.0)
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
            const link = e.target.closest('a');
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

        console.log("[Turbo] Engine Initialized & Monitoring Neural Links");
    }

    async navigate(url, pushState = true) {
        if (this.isNavigating) return;
        this.isNavigating = true;

        console.log(`[Turbo] Syncing Node: ${url}`);
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

            // 2. Intelligent Body Swap (Preserving core classes)
            const oldBody = document.body;
            const newBody = newDoc.body;
            
            // Preserve specific dashboard classes (like theme or layout modes)
            const preservedClasses = Array.from(oldBody.classList).filter(cls => 
                cls.includes('mode') || cls.includes('light') || cls.includes('perf') || cls.includes('glow')
            );

            // Swap main content (or body if main is missing)
            const oldMain = document.querySelector('main');
            const newMain = newDoc.querySelector('main');
            const oldSidebar = document.querySelector('aside#main-sidebar');
            const newSidebar = newDoc.querySelector('aside#main-sidebar');

            if (oldMain && newMain) {
                oldMain.innerHTML = newMain.innerHTML;
                // Sync main attributes (like track/lesson IDs)
                Array.from(newMain.attributes).forEach(attr => oldMain.setAttribute(attr.name, attr.value));
                
                // Sync sidebar if structure changed (e.g. new links like Quests)
                if (oldSidebar && newSidebar) {
                    oldSidebar.innerHTML = newSidebar.innerHTML;
                }
                
                // Update sidebar active states
                this.updateActiveLinks(url);
            } else {
                // Fallback: Full body replacement if structure differs significantly
                document.body.innerHTML = newBody.innerHTML;
                document.body.className = newBody.className;
            }

            // Restore preserved state classes
            preservedClasses.forEach(cls => document.body.classList.add(cls));

            // 3. Update URL
            if (pushState) window.history.pushState({}, '', url);

            // 4. Critical Rehydration
            await this.rehydrate(newDoc);

            this.hideProgressBar();
            window.dispatchEvent(new CustomEvent('sf:turbo-render'));
            window.scrollTo({ top: 0, behavior: 'auto' });

        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error("[Turbo] Neural Stale Detected. Refreshing context...", err);
                // On 404 or other errors, let the browser handle it (which will show our new 404.html)
                window.location.href = url;
            }
        } finally {
            this.isNavigating = false;
        }
    }

    async rehydrate(newDoc) {
        console.log("[Turbo] Re-hydrating Neural Matrix...");

        // A. Re-execute Page-Specific Scripts
        const mainOrBody = document.querySelector('main') || document.body;
        const scripts = mainOrBody.querySelectorAll('script');
        for (const oldScript of scripts) {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));

            if (oldScript.src) {
                await new Promise((resolve) => {
                    newScript.onload = resolve;
                    newScript.onerror = resolve;
                    document.head.appendChild(newScript);
                });
            } else {
                newScript.textContent = oldScript.textContent;
                document.body.appendChild(newScript);
            }
            oldScript.remove();
        }

        // B. Re-initialize Core Components
        if (window.lucide) window.lucide.createIcons();

        // C. Re-apply current theme (do NOT re-init — just sync DOM from stored theme)
        if (window.themeManager && window.themeManager.currentTheme) {
            window.themeManager.applyTheme(window.themeManager.currentTheme);
        }

        // D. Sync registry state using existing cached UID
        if (window.sfCore && typeof window.sfCore.syncRegistryState === 'function') {
            window.sfCore.syncRegistryState();
        }

        // E. Dispatch Render Event for manual initialization
        window.dispatchEvent(new CustomEvent('sf:turbo-render', { detail: { newDoc } }));

        console.log("[Turbo] Hydration complete.");
    }

    showProgressBar() {
        let bar = document.getElementById('turbo-progress');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'turbo-progress';
            bar.style.cssText = `
                position: fixed; top: 0; left: 0; height: 3px; 
                background: linear-gradient(to right, #f59e0b, #fbbf24); 
                z-index: 10000; transition: width 0.4s cubic-bezier(0.1, 0.7, 0.1, 1);
                box-shadow: 0 0 15px rgba(245, 158, 11, 0.6);
            `;
            document.body.appendChild(bar);
        }
        bar.style.width = '0%';
        bar.style.opacity = '1';
        setTimeout(() => bar.style.width = '40%', 10);
        setTimeout(() => bar.style.width = '85%', 600);
    }

    hideProgressBar() {
        const bar = document.getElementById('turbo-progress');
        if (bar) {
            bar.style.width = '100%';
            setTimeout(() => {
                bar.style.opacity = '0';
                setTimeout(() => bar.style.width = '0%', 400);
            }, 200);
        }
    }

    updateActiveLinks(url) {
        const sidebarLinks = document.querySelectorAll('.sidebar-link');
        const normalize = (p) => p.replace(/\/index\.html$/, '').replace(/\/$/, '') || '/';
        const targetPath = normalize(new URL(url, window.location.origin).pathname);

        sidebarLinks.forEach(link => {
            const linkPath = normalize(new URL(link.href, window.location.origin).pathname);
            if (linkPath === targetPath) {
                link.classList.add('active');
                link.setAttribute('aria-current', 'page');
            } else {
                link.classList.remove('active');
                link.removeAttribute('aria-current');
            }
        });
    }
}

export const turbo = new SkillForgeTurbo();
window.sfTurbo = turbo;
