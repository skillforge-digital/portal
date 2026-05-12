export const DESIGN_STUDIO_FONTS = [
  { name: 'Space Grotesk', family: "'Space Grotesk', sans-serif", tier: 'core', vibe: 'Modern tech-forward' },
  { name: 'Sora', family: "'Sora', sans-serif", tier: 'premium', vibe: 'Sleek futuristic' },
  { name: 'Urbanist', family: "'Urbanist', sans-serif", tier: 'premium', vibe: 'Clean luxury' },
  { name: 'Bebas Neue', family: "'Bebas Neue', sans-serif", tier: 'premium', vibe: 'Tall display' },
  { name: 'Teko', family: "'Teko', sans-serif", tier: 'premium', vibe: 'Command center' },
  { name: 'Cinzel Decorative', family: "'Cinzel Decorative', serif", tier: 'premium', vibe: 'Regal ornate' },
  { name: 'DM Serif Display', family: "'DM Serif Display', serif", tier: 'premium', vibe: 'Editorial premium' },
  { name: 'Cormorant Garamond', family: "'Cormorant Garamond', serif", tier: 'premium', vibe: 'Classical authority' },
  { name: 'Italiana', family: "'Italiana', serif", tier: 'premium', vibe: 'High fashion' },
  { name: 'Fraunces', family: "'Fraunces', serif", tier: 'premium', vibe: 'Soft power' },
  { name: 'Abril Fatface', family: "'Abril Fatface', serif", tier: 'premium', vibe: 'Bold editorial' },
  { name: 'Orbitron', family: "'Orbitron', sans-serif", tier: 'premium', vibe: 'Sci-fi HUD' },
  { name: 'Rubik Mono One', family: "'Rubik Mono One', sans-serif", tier: 'premium', vibe: 'Brutal mono' },
  { name: 'JetBrains Mono', family: "'JetBrains Mono', monospace", tier: 'core', vibe: 'Developer vibe' },
  { name: 'Great Vibes', family: "'Great Vibes', cursive", tier: 'premium', vibe: 'Curved signature' },
  { name: 'Pacifico', family: "'Pacifico', cursive", tier: 'premium', vibe: 'Curved friendly' },
  { name: 'Playfair Display', family: "'Playfair Display', serif", tier: 'core', vibe: 'Classic prestige' },
  { name: 'Unbounded', family: "'Unbounded', sans-serif", tier: 'core', vibe: 'Geometric power' }
];

export function ensureGoogleFontLoaded(fontName) {
  const name = String(fontName || '').trim();
  if (!name) return;
  const id = `sf-font-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  const family = encodeURIComponent(name).replace(/%20/g, '+');
  link.href = `https://fonts.googleapis.com/css2?family=${family}:wght@300;400;500;600;700;800;900&display=swap`;
  document.head.appendChild(link);
}

export function preloadDesignStudioFonts() {
  DESIGN_STUDIO_FONTS.forEach((f) => ensureGoogleFontLoaded(f.name));
}
