import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

function read(relPath) {
  return readFileSync(path.resolve(process.cwd(), relPath), 'utf8');
}

describe('registry admin logs rules', () => {
  test('firestore.rules contains registry_admin_logs match block', () => {
    const rules = read('firestore.rules');
    expect(rules).toMatch(/match\s+\/registry_admin_logs\/\{id\}/);
  });

  test('registry_admin_logs permissions are staff read/create and director update/delete', () => {
    const rules = read('firestore.rules');
    const start = rules.indexOf('match /registry_admin_logs/{id}');
    expect(start).toBeGreaterThan(-1);

    const tail = rules.slice(start + 1);
    const nextMatchOffset = tail.search(/\n\s*match\s+\//);
    const end = nextMatchOffset === -1 ? rules.length : start + 1 + nextMatchOffset;
    const block = rules.slice(start, end);

    expect(block).toMatch(/allow\s+read\s*,\s*create\s*:\s*if\s+isStaff\(\)\s*;/);
    expect(block).toMatch(/allow\s+update\s*,\s*delete\s*:\s*if\s+isDirector\(\)\s*;/);
    expect(block).not.toMatch(/allow\s+read\s*:\s*if\s+true\s*;/);
    expect(block).not.toMatch(/allow\s+create\s*:\s*if\s+true\s*;/);
  });
});

