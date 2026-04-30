import { describe, it, expect } from 'vitest';

function buildScholarshipFields(search) {
  const params = new URLSearchParams(search);
  const isScholarship = params.get('scholarship') === '1';
  return isScholarship
    ? { scholarship: true, scholarshipSource: 'portal_scholarship' }
    : {};
}

function mergePayload(base, isScholarship) {
  return {
    ...base,
    ...(isScholarship ? { scholarship: true, scholarshipSource: 'portal_scholarship' } : {})
  };
}

describe('scholarship tagging', () => {
  it('adds scholarship fields when scholarship=1', () => {
    expect(buildScholarshipFields('?scholarship=1')).toEqual({
      scholarship: true,
      scholarshipSource: 'portal_scholarship'
    });
  });

  it('does not add scholarship fields when scholarship param missing', () => {
    expect(buildScholarshipFields('')).toEqual({});
  });

  it('merges scholarship payload only when scholarship is true', () => {
    expect(mergePayload({ a: 1 }, true)).toEqual({
      a: 1,
      scholarship: true,
      scholarshipSource: 'portal_scholarship'
    });
    expect(mergePayload({ a: 1 }, false)).toEqual({ a: 1 });
  });
});

