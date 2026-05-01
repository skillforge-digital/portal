import { describe, it, expect } from 'vitest';
import { computeRemainingSlots, formatCountdown, isClosed, computeNextFriday2359Ms } from '../assets/scholarship-campaign.js';

describe('scholarship campaign helpers', () => {
  it('computes remaining slots', () => {
    expect(computeRemainingSlots({ totalSlots: 50, usedSlots: 0 })).toBe(50);
    expect(computeRemainingSlots({ totalSlots: 50, usedSlots: 7 })).toBe(43);
    expect(computeRemainingSlots({ totalSlots: 50, usedSlots: 60 })).toBe(0);
  });

  it('formats countdown as HH:MM:SS', () => {
    expect(formatCountdown(0)).toBe('00:00:00');
    expect(formatCountdown(1_000)).toBe('00:00:01');
    expect(formatCountdown(61_000)).toBe('00:01:01');
    expect(formatCountdown(3_661_000)).toBe('01:01:01');
  });

  it('detects closed status', () => {
    const now = 1_000_000;
    expect(isClosed({ closesAtMs: now - 1 }, now)).toBe(true);
    expect(isClosed({ closesAtMs: now + 1 }, now)).toBe(false);
  });

  it('computes next Friday 23:59 Lagos time', () => {
    const tz = 'Africa/Lagos';
    const now = new Date(Date.UTC(2026, 4, 4, 12, 0, 0));
    const ms = computeNextFriday2359Ms(tz, now);
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const parts = Object.fromEntries(dtf.formatToParts(new Date(ms)).map((p) => [p.type, p.value]));
    expect(parts.weekday).toBe('Fri');
    expect(parts.hour).toBe('23');
    expect(parts.minute).toBe('59');
  });
});
