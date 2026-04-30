import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || process.cwd());

function walk(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === '.git' || e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const files = walk(root).filter((p) => p.endsWith('.html'));
const issues = [];

for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const usesTailwindClasses =
    /\b(md:|lg:|xl:)?(p-|m-|text-|bg-|grid|flex|rounded|border)\b/.test(html);
  const hasTailwindCss = html.includes('/assets/tailwind.css');

  if (usesTailwindClasses && !hasTailwindCss) {
    issues.push({ file, issue: 'missing /assets/tailwind.css include' });
  }
}

process.stdout.write(JSON.stringify({ count: issues.length, issues }, null, 2) + '\n');
process.exit(issues.length ? 2 : 0);

