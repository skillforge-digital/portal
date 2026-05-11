import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

import { DESIGN_STUDIO_WALLPAPER_CATEGORIES } from '../assets/design-studio-presets.js';

const ROOT = path.resolve(process.cwd());

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'db8pknwmz';
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'avatars';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function readSupabaseCredsFromTraineeCustomize() {
  const p = path.join(ROOT, 'trainee-dashboard', 'customize', 'index.html');
  const html = await fs.readFile(p, 'utf8');
  const urlMatch = html.match(/const\s+supabaseUrl\s*=\s*'([^']+)'/);
  const keyMatch = html.match(/const\s+supabaseKey\s*=\s*'([^']+)'/);
  const url = urlMatch ? urlMatch[1] : '';
  const key = keyMatch ? keyMatch[1] : '';
  return { url, key };
}

function withRefresh(url) {
  try {
    const u = new URL(String(url || ''));
    u.searchParams.set('sf_refresh', String(Date.now()));
    return u.toString();
  } catch {
    return String(url || '');
  }
}

async function fetchGeneratedImageBuffer(url, { attempts = 18 } = {}) {
  const hashes = [];
  for (let i = 0; i < attempts; i += 1) {
    const target = i === 0 ? String(url) : withRefresh(url);
    const res = await fetch(target, { redirect: 'follow' });
    if (!res.ok) {
      await sleep(Math.min(9000, 1000 + i * 700));
      continue;
    }
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) {
      await sleep(Math.min(9000, 1000 + i * 700));
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const hash = crypto.createHash('sha256').update(buf).digest('hex');
    hashes.push(hash);
    const len = buf.length;

    const looksTiny = len > 0 && len < 35_000;
    const stable3 = hashes.length >= 3 && hashes[hashes.length - 1] === hashes[hashes.length - 2] && hashes[hashes.length - 2] === hashes[hashes.length - 3];
    const stable2Large = hashes.length >= 2 && hashes[hashes.length - 1] === hashes[hashes.length - 2] && len >= 35_000;

    if (!looksTiny && (stable2Large || stable3 || i >= 2)) {
      return { buf, contentType: ct };
    }

    await sleep(Math.min(9000, 1400 + i * 800));
  }
  throw new Error('Failed to fetch a stable generated image result');
}

function extFromContentType(ct) {
  const t = String(ct || '').toLowerCase();
  if (t.includes('png')) return 'png';
  if (t.includes('webp')) return 'webp';
  if (t.includes('jpeg') || t.includes('jpg')) return 'jpg';
  return 'jpg';
}

async function supabaseUploadObject({ supabaseUrl, supabaseKey, bucket, objectPath, body, contentType }) {
  const endpoint = `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/${bucket}/${objectPath}`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': contentType,
      'x-upsert': 'true'
    },
    body
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase upload failed (${res.status}): ${text.slice(0, 300)}`);
  }
  return `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/public/${bucket}/${objectPath}`;
}

function cloudinaryFetch(publicUrl, { width }) {
  const w = Number(width || 0) || 2000;
  return `https://res.cloudinary.com/${encodeURIComponent(CLOUDINARY_CLOUD_NAME)}/image/fetch/f_auto,q_auto,w_${w}/${encodeURIComponent(String(publicUrl || ''))}`;
}

async function writeStaticMap(map) {
  const outPath = path.join(ROOT, 'assets', 'design-studio-wallpapers-static.js');
  const stable = Object.keys(map).sort().reduce((acc, k) => {
    acc[k] = map[k];
    return acc;
  }, {});
  const body = `export const DESIGN_STUDIO_WALLPAPER_STATIC_MAP = ${JSON.stringify(stable, null, 2)};\n`;
  await fs.writeFile(outPath, body, 'utf8');
}

function listWallpapers() {
  const cats = Array.isArray(DESIGN_STUDIO_WALLPAPER_CATEGORIES) ? DESIGN_STUDIO_WALLPAPER_CATEGORIES : [];
  return cats.flatMap((c) => (Array.isArray(c.wallpapers) ? c.wallpapers : []).map((w) => ({
    category: c.id,
    id: w.id,
    url: w.url,
    thumb: w.thumb || w.url
  })));
}

async function main() {
  const envUrl = process.env.SUPABASE_URL || '';
  const envKey = process.env.SUPABASE_ANON_KEY || '';

  const fallback = (!envUrl || !envKey) ? await readSupabaseCredsFromTraineeCustomize() : { url: '', key: '' };
  const supabaseUrl = envUrl || fallback.url;
  const supabaseKey = envKey || fallback.key;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_ANON_KEY, or ensure trainee-dashboard/customize/index.html contains them.');
  }

  const all = listWallpapers();
  const filter = String(process.env.ONLY || '').trim();
  const selected = filter ? all.filter((w) => w.id.includes(filter) || w.category.includes(filter)) : all;

  const concurrency = Math.max(1, Number(process.env.CONCURRENCY || 3) || 3);
  const queue = [...selected];
  const staticMap = {};

  let active = 0;
  const runNext = async () => {
    const item = queue.shift();
    if (!item) return;
    active += 1;
    try {
      const full = await fetchGeneratedImageBuffer(item.url);
      const fullExt = extFromContentType(full.contentType);
      const fullObjectPath = `wallpapers/presets/${item.category}/${item.id}_16x9.${fullExt}`;
      const fullPublic = await supabaseUploadObject({
        supabaseUrl,
        supabaseKey,
        bucket: SUPABASE_BUCKET,
        objectPath: fullObjectPath,
        body: full.buf,
        contentType: full.contentType
      });

      const th = await fetchGeneratedImageBuffer(item.thumb);
      const thExt = extFromContentType(th.contentType);
      const thObjectPath = `wallpapers/presets/${item.category}/${item.id}_4x3.${thExt}`;
      const thPublic = await supabaseUploadObject({
        supabaseUrl,
        supabaseKey,
        bucket: SUPABASE_BUCKET,
        objectPath: thObjectPath,
        body: th.buf,
        contentType: th.contentType
      });

      staticMap[item.id] = {
        supabase: { url: fullPublic, thumb: thPublic },
        url: cloudinaryFetch(fullPublic, { width: 2000 }),
        thumb: cloudinaryFetch(thPublic, { width: 900 })
      };
    } finally {
      active -= 1;
      await runNext();
    }
  };

  const starters = Array.from({ length: Math.min(concurrency, queue.length) }, () => runNext());
  await Promise.all(starters);

  await writeStaticMap(staticMap);
}

await main();

