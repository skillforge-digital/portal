import { describe, it, expect, vi } from 'vitest';

vi.mock('../assets/firebase-config.js', () => ({
  db: {},
  auth: {}
}));

vi.mock('https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js', () => ({
  onAuthStateChanged: vi.fn()
}));

vi.mock('https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  increment: vi.fn((n) => ({ op: 'increment', n })),
  serverTimestamp: vi.fn(() => ({ op: 'serverTimestamp' })),
  addDoc: vi.fn(),
  collection: vi.fn(),
}));

vi.mock('../assets/system-debugger.js', () => ({
  SystemDebugger: class {}
}));

describe('presence tracking', () => {
  it('includes track and name when available', async () => {
    const { buildPresencePatch } = await import('../assets/sf-core.js');

    const patch = buildPresencePatch({
      registryState: { track: 'Web Development', name: 'Ada' },
      engagementScore: 0.5,
      durationSeconds: 120
    });

    expect(patch.track).toBe('Web Development');
    expect(patch.name).toBe('Ada');
  });
});
