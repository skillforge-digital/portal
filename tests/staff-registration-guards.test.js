import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

describe('staff registration guards', () => {
  test('prevents submit without verified role code', () => {
    const html = readFileSync(path.resolve(process.cwd(), 'staffs/registration/index.html'), 'utf8');
    expect(html).toMatch(/if\s*\(\s*!\s*assignedCode/);
  });

  test('avoids forbidden update of track_access by checking existence first', () => {
    const html = readFileSync(path.resolve(process.cwd(), 'staffs/registration/index.html'), 'utf8');
    expect(html).toMatch(/getDoc\s*\(\s*trackAccessRef\s*\)/);
  });
});
