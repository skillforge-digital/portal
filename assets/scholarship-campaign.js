export function computeRemainingSlots(doc) {
  const total = Number(doc?.totalSlots ?? 0);
  const used = Number(doc?.usedSlots ?? 0);
  const remaining = total - used;
  return remaining > 0 ? remaining : 0;
}

export function formatCountdown(ms) {
  const safe = Number.isFinite(ms) && ms > 0 ? ms : 0;
  const totalSeconds = Math.floor(safe / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function isClosed(campaign, nowMs = Date.now()) {
  const closesAtMs = Number(campaign?.closesAtMs ?? 0);
  return closesAtMs > 0 && nowMs >= closesAtMs;
}

export function setText(id, text) {
  if (typeof document === 'undefined') return;
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
}

export function setDisabled(selector, disabled) {
  if (typeof document === 'undefined') return;
  document.querySelectorAll(selector).forEach((el) => {
    if (disabled) {
      el.setAttribute('aria-disabled', 'true');
      el.classList.add('pointer-events-none', 'opacity-50');
    } else {
      el.removeAttribute('aria-disabled');
      el.classList.remove('pointer-events-none', 'opacity-50');
    }
  });
}

export function toCampaignModel(input) {
  const totalSlots = Number(input?.totalSlots ?? 0);
  const usedSlots = Number(input?.usedSlots ?? 0);
  const closesAtMs = toMillis(input?.closesAt ?? input?.closesAtMs ?? 0);
  return {
    totalSlots: Number.isFinite(totalSlots) && totalSlots > 0 ? totalSlots : 0,
    usedSlots: Number.isFinite(usedSlots) && usedSlots > 0 ? usedSlots : 0,
    closesAtMs: Number.isFinite(closesAtMs) && closesAtMs > 0 ? closesAtMs : 0
  };
}

export function getCampaignViewState(campaign, nowMs = Date.now()) {
  const model = toCampaignModel(campaign);
  const remainingSlots = computeRemainingSlots(model);
  const closed = isClosed(model, nowMs);
  const soldOut = remainingSlots === 0 && model.totalSlots > 0;
  const countdownMs = model.closesAtMs > 0 ? Math.max(0, model.closesAtMs - nowMs) : 0;

  let status = 'Status unavailable';
  if (model.totalSlots > 0 || model.closesAtMs > 0) status = 'Open';
  if (soldOut) status = 'Sold out';
  if (closed) status = 'Closed';

  return {
    status,
    remainingSlots,
    closed,
    soldOut,
    countdownMs,
    closesAtMs: model.closesAtMs,
    totalSlots: model.totalSlots,
    usedSlots: model.usedSlots
  };
}

export function renderCampaignStrip({
  campaign,
  nowMs = Date.now(),
  ids = { status: 'campaign-status', countdown: 'campaign-countdown', slots: 'campaign-slots' },
  applySelector = '.scholarship-apply'
} = {}) {
  const view = getCampaignViewState(campaign, nowMs);
  setText(ids.status, view.status);

  if (view.totalSlots > 0) {
    setText(ids.slots, String(view.remainingSlots));
  }

  if (view.closesAtMs > 0) {
    setText(ids.countdown, formatCountdown(view.countdownMs));
  } else {
    setText(ids.countdown, '');
  }

  const shouldDisable = view.closed || view.soldOut;
  setDisabled(applySelector, shouldDisable);
  return view;
}

export function startCampaignTicker({
  getCampaign,
  render,
  intervalMs = 1000,
  now = () => Date.now()
} = {}) {
  if (typeof window === 'undefined') return () => {};
  if (typeof render !== 'function') return () => {};
  const getter = typeof getCampaign === 'function' ? getCampaign : () => undefined;

  render(getter(), now());
  const id = window.setInterval(() => render(getter(), now()), intervalMs);
  return () => window.clearInterval(id);
}

export function getScholarshipCampaignPath(seasonId = '2026') {
  return ['seasons', String(seasonId), 'artifacts', 'registration', 'scholarship'];
}

export async function loadScholarshipCampaign({ db, doc, getDoc }, { seasonId = '2026' } = {}) {
  if (!db || typeof doc !== 'function' || typeof getDoc !== 'function') return null;
  const ref = doc(db, ...getScholarshipCampaignPath(seasonId));
  const snap = await getDoc(ref);
  if (!snap?.exists?.()) return null;
  return toCampaignModel(snap.data());
}

export function computeNextFriday2359Ms(timeZone = 'Africa/Lagos', now = new Date()) {
  const nowParts = getZonedParts(now, timeZone);
  const weekdayIndex = new Date(Date.UTC(nowParts.year, nowParts.month - 1, nowParts.day)).getUTCDay();

  let daysUntilFriday = (5 - weekdayIndex + 7) % 7;
  if (daysUntilFriday === 0) {
    const nowSeconds = nowParts.hour * 3600 + nowParts.minute * 60 + nowParts.second;
    const closeSeconds = 23 * 3600 + 59 * 60;
    if (nowSeconds >= closeSeconds) daysUntilFriday = 7;
  }

  const base = new Date(Date.UTC(nowParts.year, nowParts.month - 1, nowParts.day));
  base.setUTCDate(base.getUTCDate() + daysUntilFriday);

  return zonedDateTimeToUtcMs(
    {
      year: base.getUTCFullYear(),
      month: base.getUTCMonth() + 1,
      day: base.getUTCDate(),
      hour: 23,
      minute: 59,
      second: 0
    },
    timeZone
  );
}

function toMillis(value) {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value?.toMillis === 'function') return Number(value.toMillis());
  return 0;
}

function getZonedParts(date, timeZone) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
    hour12: false
  });

  const parts = dtf.formatToParts(date);
  const out = {};
  for (const part of parts) out[part.type] = part.value;

  return {
    year: Number(out.year),
    month: Number(out.month),
    day: Number(out.day),
    hour: Number(out.hour),
    minute: Number(out.minute),
    second: Number(out.second),
    weekday: out.weekday
  };
}

function getTimeZoneOffsetMs(timeZone, date) {
  const p = getZonedParts(date, timeZone);
  const asUtcMs = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtcMs - date.getTime();
}

function zonedDateTimeToUtcMs({ year, month, day, hour, minute, second }, timeZone) {
  const guessUtcMs = Date.UTC(year, month - 1, day, hour, minute, second);
  const offsetMs = getTimeZoneOffsetMs(timeZone, new Date(guessUtcMs));
  return guessUtcMs - offsetMs;
}
