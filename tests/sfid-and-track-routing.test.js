import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

function read(relPath) {
  return readFileSync(path.resolve(process.cwd(), relPath), 'utf8');
}

describe('SFID + academy routing', () => {
  test('trainee registration does not generate SFID with SFD fallback', () => {
    const html = read('trainee-registration/index.html');
    expect(html).not.toMatch(/['"]SFD['"]/);
    expect(html).not.toMatch(/SFID-26-SFD/);
    expect(html).not.toMatch(/\|\|\s*['"]SFD['"]/);
  });

  test('academy redirect does not append raw targetTrack (spaces would 404)', () => {
    const html = read('academy/index.html');
    expect(html).not.toMatch(/redirectUrl\s*\+=\s*targetTrack\s*\+\s*['"]\/['"]/);
  });

  test('my-track link mapping includes Forex Synthetic Indices variant', () => {
    const html = read('trainee-dashboard/index.html');
    expect(html).toMatch(/Forex Synthetic Indices/);
  });
});

