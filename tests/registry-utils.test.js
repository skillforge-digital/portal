import { describe, it, expect } from 'vitest';
import { buildWhatsappMessage, buildWhatsappLink, normalizePhone, getTelegramLinkForTrack } from '../assets/registry-utils.js';

describe('registry utils', () => {
  it('normalizes nigeria phone digits-only', () => {
    expect(normalizePhone('2349012345678')).toBe('2349012345678');
    expect(normalizePhone('+2349012345678')).toBe('2349012345678');
    expect(normalizePhone(' 234 901 234 5678 ')).toBe('2349012345678');
  });

  it('telegram link resolves by track', () => {
    expect(getTelegramLinkForTrack('Web Development')).toMatch(/^https:\/\/t\.me\//);
    expect(getTelegramLinkForTrack('Unknown Track')).toBe('https://t.me/skillforgeorg');
  });

  it('builds a short onboarding message', () => {
    const msg = buildWhatsappMessage({
      name: 'Ada',
      track: 'Web Development',
      telegramLink: 'https://t.me/example'
    });
    expect(msg).toContain('Congratulations Ada');
    expect(msg).toContain('Your track: Web Development');
    expect(msg).toContain('https://t.me/example');
    expect(msg).toContain('Please save this contact for further assistance.');
  });

  it('builds a wa.me link with encoded text', () => {
    const url = buildWhatsappLink({ phone: '2349012345678', text: 'Hello world' });
    expect(url).toBe('https://wa.me/2349012345678?text=Hello%20world');
  });
});
