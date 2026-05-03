import { describe, it, expect } from 'vitest';
import { getAssignedTrack } from '../staffs/specialist/specialist-assigned-track.js';

describe('getAssignedTrack', () => {
  it('prefers assignedTrack', () => {
    expect(getAssignedTrack({ assignedTrack: 'Web Development', tracks: ['Graphic Design'] })).toBe('Web Development');
  });

  it('falls back to tracks when it is exactly one', () => {
    expect(getAssignedTrack({ tracks: ['Graphic Design'] })).toBe('Graphic Design');
  });

  it('returns empty when ambiguous', () => {
    expect(getAssignedTrack({ tracks: ['Graphic Design', 'Web Development'] })).toBe('');
  });
});
