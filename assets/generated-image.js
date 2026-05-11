const BG_TIMERS = new WeakMap();

export const isGeneratedAssetUrl = (url) => /coresg-normal\.trae\.ai\/api\/ide\/v1\/text_to_image/i.test(String(url || ''));

export const withRefresh = (url, stamp = Date.now()) => {
  try {
    const u = new URL(String(url || ''), window.location.origin);
    u.searchParams.set('sf_refresh', String(stamp));
    return u.toString();
  } catch {
    return String(url || '');
  }
};

export function hydrateImageElement(imgEl, baseUrl, options = {}) {
  const url = String(baseUrl || '').trim();
  if (!imgEl || !url) return;

  const maxAttempts = Number(options.maxAttempts || 0) || (isGeneratedAssetUrl(url) ? 12 : 1);
  const baseDelay = Number(options.baseDelay || 0) || 1200;
  const maxDelay = Number(options.maxDelay || 0) || 9000;

  let attempt = 0;

  const load = (a) => {
    imgEl.src = a === 0 ? url : withRefresh(url);
  };

  const tick = () => {
    attempt += 1;
    if (attempt >= maxAttempts) return;
    load(attempt);
    const delay = Math.min(maxDelay, baseDelay * attempt);
    window.setTimeout(tick, delay);
  };

  imgEl.onerror = () => {
    if (attempt < maxAttempts - 1) {
      attempt += 1;
      imgEl.src = withRefresh(url);
    }
  };

  load(0);
  if (maxAttempts > 1) window.setTimeout(tick, baseDelay);
}

export function scheduleBackgroundHydration(el, baseUrl, options = {}) {
  const url = String(baseUrl || '').trim();
  if (!el) return;

  const prior = BG_TIMERS.get(el);
  if (prior) {
    window.clearInterval(prior);
    BG_TIMERS.delete(el);
  }

  if (!url) {
    el.style.backgroundImage = '';
    return;
  }

  el.style.backgroundImage = `url('${url}')`;

  if (!isGeneratedAssetUrl(url)) return;

  const intervalMs = Number(options.intervalMs || 0) || 1600;
  const maxAttempts = Number(options.maxAttempts || 0) || 12;
  let attempts = 0;

  const timer = window.setInterval(() => {
    attempts += 1;
    if (attempts >= maxAttempts) {
      window.clearInterval(timer);
      BG_TIMERS.delete(el);
      return;
    }
    el.style.backgroundImage = `url('${withRefresh(url)}')`;
  }, intervalMs);

  BG_TIMERS.set(el, timer);
}

