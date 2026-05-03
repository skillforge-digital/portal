import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

function read(relPath) {
  return readFileSync(path.resolve(process.cwd(), relPath), 'utf8');
}

describe('director registry logs tab', () => {
  test('director dashboard includes Registry Logs tab button', () => {
    const html = read('staffs/director/index.html');
    expect(html).toMatch(/data-tab="registry-logs"/);
    expect(html).toMatch(/Registry Logs/);
  });

  test('renders registry_admin_logs ordered by timestamp desc limit 500', () => {
    const html = read('staffs/director/index.html');
    expect(html).toMatch(/renderRegistryLogs/);
    expect(html).toMatch(/collection\(db,\s*'registry_admin_logs'\)/);
    expect(html).toMatch(/orderBy\(\s*'timestamp'\s*,\s*'desc'\s*\)/);
    expect(html).toMatch(/limit\(\s*500\s*\)/);
  });
});

