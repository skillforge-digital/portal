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

const enc = (s) => encodeURIComponent(String(s || '')).replace(/%20/g, '+');
const img = (prompt) => `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${enc(prompt)}&image_size=landscape_16_9`;

export const DESIGN_STUDIO_WALLPAPER_CATEGORIES = [
  {
    id: 'dark',
    name: 'Dark',
    wallpapers: [
      { id: 'obsidian-gold', url: img('ultra realistic black obsidian stone texture with subtle gold veins, cinematic studio lighting, moody, luxury, high contrast, 8k, no text') },
      { id: 'carbon-fiber', url: img('macro carbon fiber weave, matte black, soft rim light, premium industrial aesthetic, 8k, no text') },
      { id: 'noir-city', url: img('night city skyline in rain, dark navy and black, neon gold accents, cinematic, minimal, ultra realistic, 8k, no text') }
    ]
  },
  {
    id: 'anime',
    name: 'Anime',
    wallpapers: [
      { id: 'neo-tokyo', url: img('original anime inspired neon cyber city street at night, rain reflections, moody, high detail, cinematic lighting, 8k, no text') },
      { id: 'mecha-hangar', url: img('original anime inspired mech hangar silhouette, dark industrial, gold accents, cinematic volumetric light, 8k, no text') },
      { id: 'sakuga-sky', url: img('original anime inspired night sky with dramatic clouds, deep navy, subtle gold stars, cinematic, high detail, 8k, no text') }
    ]
  },
  {
    id: 'heroes',
    name: 'Heroes',
    wallpapers: [
      { id: 'comic-silhouette', url: img('original comic book heroic silhouette on rooftop, dramatic rim light, dark palette with gold highlights, halftone texture, 8k, no text') },
      { id: 'shield-emblem', url: img('original stylized heroic emblem and shield, dark metal, gold inlays, cinematic light, premium, 8k, no text') },
      { id: 'city-guardian', url: img('original comic style guardian overlooking futuristic city, deep blacks, gold neon, cinematic, high detail, 8k, no text') }
    ]
  },
  {
    id: 'space',
    name: 'Space',
    wallpapers: [
      { id: 'nebula-gold', url: img('deep space nebula, dark navy and black, gold cosmic dust, ultra realistic, long exposure style, 8k, no text') },
      { id: 'ring-planet', url: img('cinematic ringed planet over dark horizon, minimal composition, gold accent light, ultra realistic, 8k, no text') },
      { id: 'astronaut-hud', url: img('astronaut silhouette with subtle sci fi HUD lines, dark background, gold glow, cinematic, ultra detailed, 8k, no text') }
    ]
  },
  {
    id: 'ecosystem',
    name: 'Eco',
    wallpapers: [
      { id: 'rainforest-canopy', url: img('aerial rainforest canopy at dusk, deep greens and shadows, cinematic, premium, 8k, no text') },
      { id: 'moss-stone', url: img('macro moss on dark stone, rich texture, moody lighting, premium natural aesthetic, 8k, no text') },
      { id: 'bioluminescent', url: img('bioluminescent forest floor, dark background, subtle gold glow, cinematic, high detail, 8k, no text') }
    ]
  },
  {
    id: 'nature',
    name: 'Nature',
    wallpapers: [
      { id: 'mountain-noir', url: img('cinematic mountain range at night, dark clouds, moonlit edges, subtle gold highlights, ultra realistic, 8k, no text') },
      { id: 'ocean-night', url: img('dark ocean waves at night, cinematic lighting, minimal, premium, 8k, no text') },
      { id: 'desert-stars', url: img('desert dunes under starry night, deep navy, gold stars, cinematic, ultra realistic, 8k, no text') }
    ]
  }
];

export function ensureGoogleFontLoaded(fontName) {
  const name = String(fontName || '').trim();
  if (!name) return;
  const id = `sf-font-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${enc(name)}:wght@300;400;500;600;700;800;900&display=swap`;
  document.head.appendChild(link);
}

export function preloadDesignStudioFonts() {
  DESIGN_STUDIO_FONTS.forEach((f) => ensureGoogleFontLoaded(f.name));
}

export function getDesignStudioWallpapers(categoryId) {
  const target = String(categoryId || '').trim();
  const cats = Array.isArray(DESIGN_STUDIO_WALLPAPER_CATEGORIES) ? DESIGN_STUDIO_WALLPAPER_CATEGORIES : [];
  const list = cats.flatMap((c) =>
    (Array.isArray(c.wallpapers) ? c.wallpapers : []).map((w) => ({
      category: c.id,
      categoryName: c.name,
      id: w.id,
      url: w.url
    }))
  );
  if (!target || target === 'all') return list;
  return list.filter((w) => w.category === target);
}
