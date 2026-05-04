import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

function read(relPath) {
  return readFileSync(path.resolve(process.cwd(), relPath), 'utf8');
}

describe('staff dashboards bootstrap imports', () => {
  test('HOD dashboard imports staff-core and auth', () => {
    const html = read('staffs/hod/index.html');
    expect(html).toMatch(/import\s+StaffCore\s+from\s+['"]\.\.\/\.\.\/assets\/staff-core\.js['"]/);
    expect(html).toMatch(/import\s+\{\s*db\s*,\s*auth\s*\}\s+from\s+['"]\.\.\/\.\.\/assets\/firebase-config\.js['"]/);
  });

  test('Support dashboard imports auth', () => {
    const html = read('staffs/support/index.html');
    expect(html).toMatch(/import\s+\{\s*db\s*,\s*auth\s*\}\s+from\s+['"]\.\.\/\.\.\/assets\/firebase-config\.js['"]/);
  });

  test('Specialist dashboard imports auth', () => {
    const html = read('staffs/specialist/index.html');
    expect(html).toMatch(/import\s+\{\s*db\s*,\s*auth\s*\}\s+from\s+['"]\.\.\/\.\.\/assets\/firebase-config\.js['"]/);
  });
});

