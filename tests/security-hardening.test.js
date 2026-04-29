import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

function read(relPath) {
  return readFileSync(path.resolve(process.cwd(), relPath), 'utf8');
}

describe('security hardening', () => {
  test('does not store trainee password in Firestore on password reset', () => {
    const html = read('trainee-login/reset-password.html');
    expect(html).not.toMatch(/password:\s*pass/);
    expect(html).not.toMatch(/password:\s*pass\s*,/);
  });

  test('does not store trainee password in Firestore on staff password reset', () => {
    const html = read('staffs/login/reset-password.html');
    expect(html).not.toMatch(/password:\s*pass/);
    expect(html).not.toMatch(/password:\s*pass\s*,/);
  });

  test('trainee login does not use legacy Firestore password migration', () => {
    const html = read('trainee-login/index.html');
    expect(html).not.toMatch(/legacyData\.password/);
  });

  test('firestore rules do not allow public role_codes writes', () => {
    const rules = read('firestore.rules');
    const start = rules.indexOf('match /role_codes/{code}');
    expect(start).toBeGreaterThan(-1);
    const end = rules.indexOf('match /system/', start);
    const block = rules.slice(start, end > -1 ? end : undefined);
    expect(block).not.toMatch(/allow\s+write:\s+if\s+true\s*;/);
  });
});
