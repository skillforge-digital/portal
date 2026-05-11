import { DESIGN_STUDIO_WALLPAPER_STATIC_MAP } from './design-studio-wallpapers-static.js';

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
const img = (prompt, image_size = 'landscape_16_9') => `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${enc(prompt)}&image_size=${encodeURIComponent(String(image_size || 'landscape_16_9'))}`;

export const DESIGN_STUDIO_WALLPAPER_CATEGORIES = [
  {
    id: 'dark',
    name: 'Dark',
    wallpapers: [
      { id: 'obsidian-gold', url: img('ultra realistic black obsidian stone texture with subtle gold veins, cinematic studio lighting, moody, luxury, high contrast, 8k, no text'), thumb: img('ultra realistic black obsidian stone texture with subtle gold veins, cinematic studio lighting, moody, luxury, high contrast, 8k, no text', 'landscape_4_3') },
      { id: 'carbon-fiber', url: img('macro carbon fiber weave, matte black, soft rim light, premium industrial aesthetic, 8k, no text'), thumb: img('macro carbon fiber weave, matte black, soft rim light, premium industrial aesthetic, 8k, no text', 'landscape_4_3') },
      { id: 'noir-city', url: img('night city skyline in rain, dark navy and black, neon gold accents, cinematic, minimal, ultra realistic, 8k, no text'), thumb: img('night city skyline in rain, dark navy and black, neon gold accents, cinematic, minimal, ultra realistic, 8k, no text', 'landscape_4_3') },
      { id: 'black-marble', url: img('ultra realistic black marble slab with subtle metallic gold veins, minimal composition, soft studio lighting, premium, 8k, no text'), thumb: img('ultra realistic black marble slab with subtle metallic gold veins, minimal composition, soft studio lighting, premium, 8k, no text', 'landscape_4_3') },
      { id: 'smoke-velvet', url: img('deep black velvet fabric texture with subtle smoke haze, soft rim lighting, luxury minimal, ultra realistic, 8k, no text'), thumb: img('deep black velvet fabric texture with subtle smoke haze, soft rim lighting, luxury minimal, ultra realistic, 8k, no text', 'landscape_4_3') },
      { id: 'dark-grid', url: img('minimal futuristic dark grid, matte black, subtle gold glow lines, clean ui background, premium, ultra realistic, 8k, no text'), thumb: img('minimal futuristic dark grid, matte black, subtle gold glow lines, clean ui background, premium, ultra realistic, 8k, no text', 'landscape_4_3') }
    ]
  },
  {
    id: 'anime',
    name: 'Anime',
    wallpapers: [
      { id: 'neo-tokyo', url: img('original anime inspired neon cyber city street at night, rain reflections, moody, high detail, cinematic lighting, 8k, no text'), thumb: img('original anime inspired neon cyber city street at night, rain reflections, moody, high detail, cinematic lighting, 8k, no text', 'landscape_4_3') },
      { id: 'mecha-hangar', url: img('original anime inspired mech hangar silhouette, dark industrial, gold accents, cinematic volumetric light, 8k, no text'), thumb: img('original anime inspired mech hangar silhouette, dark industrial, gold accents, cinematic volumetric light, 8k, no text', 'landscape_4_3') },
      { id: 'sakuga-sky', url: img('original anime inspired night sky with dramatic clouds, deep navy, subtle gold stars, cinematic, high detail, 8k, no text'), thumb: img('original anime inspired night sky with dramatic clouds, deep navy, subtle gold stars, cinematic, high detail, 8k, no text', 'landscape_4_3') },
      { id: 'samurai-rim', url: img('original anime inspired samurai silhouette, moody backlight, dark palette with gold rim light, cinematic fog, high detail, 8k, no text'), thumb: img('original anime inspired samurai silhouette, moody backlight, dark palette with gold rim light, cinematic fog, high detail, 8k, no text', 'landscape_4_3') },
      { id: 'shinjuku-signals', url: img('original anime inspired city crosswalk at night, neon signage glow, dark navy, warm gold accents, rain reflections, cinematic, 8k, no text'), thumb: img('original anime inspired city crosswalk at night, neon signage glow, dark navy, warm gold accents, rain reflections, cinematic, 8k, no text', 'landscape_4_3') },
      { id: 'moon-koi', url: img('original anime inspired koi fish under moonlight, dark water, subtle gold highlights, minimal composition, cinematic, 8k, no text'), thumb: img('original anime inspired koi fish under moonlight, dark water, subtle gold highlights, minimal composition, cinematic, 8k, no text', 'landscape_4_3') }
    ]
  },
  {
    id: 'heroes',
    name: 'Heroes',
    wallpapers: [
      { id: 'comic-silhouette', url: img('original comic book heroic silhouette on rooftop, dramatic rim light, dark palette with gold highlights, halftone texture, 8k, no text'), thumb: img('original comic book heroic silhouette on rooftop, dramatic rim light, dark palette with gold highlights, halftone texture, 8k, no text', 'landscape_4_3') },
      { id: 'shield-emblem', url: img('original stylized heroic emblem and shield, dark metal, gold inlays, cinematic light, premium, 8k, no text'), thumb: img('original stylized heroic emblem and shield, dark metal, gold inlays, cinematic light, premium, 8k, no text', 'landscape_4_3') },
      { id: 'city-guardian', url: img('original comic style guardian overlooking futuristic city, deep blacks, gold neon, cinematic, high detail, 8k, no text'), thumb: img('original comic style guardian overlooking futuristic city, deep blacks, gold neon, cinematic, high detail, 8k, no text', 'landscape_4_3') },
      { id: 'mask-noir', url: img('original comic hero mask close up, matte black material, subtle gold reflections, premium studio light, minimal background, 8k, no text'), thumb: img('original comic hero mask close up, matte black material, subtle gold reflections, premium studio light, minimal background, 8k, no text', 'landscape_4_3') },
      { id: 'cape-wind', url: img('original comic hero cape in wind, moody dark sky, gold lightning glow, cinematic, high contrast, 8k, no text'), thumb: img('original comic hero cape in wind, moody dark sky, gold lightning glow, cinematic, high contrast, 8k, no text', 'landscape_4_3') },
      { id: 'emblem-forge', url: img('original heroic emblem forged in dark metal, glowing gold edges, sparks, cinematic macro, premium, 8k, no text'), thumb: img('original heroic emblem forged in dark metal, glowing gold edges, sparks, cinematic macro, premium, 8k, no text', 'landscape_4_3') }
    ]
  },
  {
    id: 'space',
    name: 'Space',
    wallpapers: [
      { id: 'nebula-gold', url: img('deep space nebula, dark navy and black, gold cosmic dust, ultra realistic, long exposure style, 8k, no text'), thumb: img('deep space nebula, dark navy and black, gold cosmic dust, ultra realistic, long exposure style, 8k, no text', 'landscape_4_3') },
      { id: 'ring-planet', url: img('cinematic ringed planet over dark horizon, minimal composition, gold accent light, ultra realistic, 8k, no text'), thumb: img('cinematic ringed planet over dark horizon, minimal composition, gold accent light, ultra realistic, 8k, no text', 'landscape_4_3') },
      { id: 'astronaut-hud', url: img('astronaut silhouette with subtle sci fi HUD lines, dark background, gold glow, cinematic, ultra detailed, 8k, no text'), thumb: img('astronaut silhouette with subtle sci fi HUD lines, dark background, gold glow, cinematic, ultra detailed, 8k, no text', 'landscape_4_3') },
      { id: 'starlane', url: img('long exposure star trails over dark horizon, subtle gold tint, minimal composition, ultra realistic, 8k, no text'), thumb: img('long exposure star trails over dark horizon, subtle gold tint, minimal composition, ultra realistic, 8k, no text', 'landscape_4_3') },
      { id: 'moon-surface', url: img('ultra realistic moon surface macro, deep shadows, subtle gold sunlight, cinematic, minimal, 8k, no text'), thumb: img('ultra realistic moon surface macro, deep shadows, subtle gold sunlight, cinematic, minimal, 8k, no text', 'landscape_4_3') },
      { id: 'deep-horizon', url: img('space horizon over dark planet, thin gold atmospheric glow, clean minimal, ultra realistic, 8k, no text'), thumb: img('space horizon over dark planet, thin gold atmospheric glow, clean minimal, ultra realistic, 8k, no text', 'landscape_4_3') }
    ]
  },
  {
    id: 'ecosystem',
    name: 'Eco',
    wallpapers: [
      { id: 'rainforest-canopy', url: img('aerial rainforest canopy at dusk, deep greens and shadows, cinematic, premium, 8k, no text'), thumb: img('aerial rainforest canopy at dusk, deep greens and shadows, cinematic, premium, 8k, no text', 'landscape_4_3') },
      { id: 'moss-stone', url: img('macro moss on dark stone, rich texture, moody lighting, premium natural aesthetic, 8k, no text'), thumb: img('macro moss on dark stone, rich texture, moody lighting, premium natural aesthetic, 8k, no text', 'landscape_4_3') },
      { id: 'bioluminescent', url: img('bioluminescent forest floor, dark background, subtle gold glow, cinematic, high detail, 8k, no text'), thumb: img('bioluminescent forest floor, dark background, subtle gold glow, cinematic, high detail, 8k, no text', 'landscape_4_3') },
      { id: 'fern-shadow', url: img('macro fern leaf in shadow, deep greens, subtle gold light spill, premium, ultra realistic, 8k, no text'), thumb: img('macro fern leaf in shadow, deep greens, subtle gold light spill, premium, ultra realistic, 8k, no text', 'landscape_4_3') },
      { id: 'river-night', url: img('dark river at night, soft mist, subtle warm gold reflection, cinematic, minimal, 8k, no text'), thumb: img('dark river at night, soft mist, subtle warm gold reflection, cinematic, minimal, 8k, no text', 'landscape_4_3') },
      { id: 'stone-lichen', url: img('macro lichen on dark stone, rich texture, moody lighting, premium eco aesthetic, 8k, no text'), thumb: img('macro lichen on dark stone, rich texture, moody lighting, premium eco aesthetic, 8k, no text', 'landscape_4_3') }
    ]
  },
  {
    id: 'nature',
    name: 'Nature',
    wallpapers: [
      { id: 'mountain-noir', url: img('cinematic mountain range at night, dark clouds, moonlit edges, subtle gold highlights, ultra realistic, 8k, no text'), thumb: img('cinematic mountain range at night, dark clouds, moonlit edges, subtle gold highlights, ultra realistic, 8k, no text', 'landscape_4_3') },
      { id: 'ocean-night', url: img('dark ocean waves at night, cinematic lighting, minimal, premium, 8k, no text'), thumb: img('dark ocean waves at night, cinematic lighting, minimal, premium, 8k, no text', 'landscape_4_3') },
      { id: 'desert-stars', url: img('desert dunes under starry night, deep navy, gold stars, cinematic, ultra realistic, 8k, no text'), thumb: img('desert dunes under starry night, deep navy, gold stars, cinematic, ultra realistic, 8k, no text', 'landscape_4_3') },
      { id: 'forest-fog', url: img('cinematic forest in fog at night, deep shadows, subtle gold moonlight, ultra realistic, premium, 8k, no text'), thumb: img('cinematic forest in fog at night, deep shadows, subtle gold moonlight, ultra realistic, premium, 8k, no text', 'landscape_4_3') },
      { id: 'waterfall-noir', url: img('dark waterfall scene at night, misty atmosphere, subtle gold light accents, cinematic, ultra realistic, 8k, no text'), thumb: img('dark waterfall scene at night, misty atmosphere, subtle gold light accents, cinematic, ultra realistic, 8k, no text', 'landscape_4_3') },
      { id: 'canyon-moon', url: img('cinematic canyon under moonlight, deep navy shadows, warm gold rim light, ultra realistic, minimal, 8k, no text'), thumb: img('cinematic canyon under moonlight, deep navy shadows, warm gold rim light, ultra realistic, minimal, 8k, no text', 'landscape_4_3') }
    ]
  },
  {
    id: 'minimal',
    name: 'Minimal',
    wallpapers: [
      { id: 'paper-grain', url: img('minimal premium paper grain texture, warm neutral dark, soft studio lighting, clean background, ultra realistic, 8k, no text'), thumb: img('minimal premium paper grain texture, warm neutral dark, soft studio lighting, clean background, ultra realistic, 8k, no text', 'landscape_4_3') },
      { id: 'gradient-noir', url: img('minimal dark gradient, deep navy to black, subtle gold vignette, smooth, modern ui background, 8k, no text'), thumb: img('minimal dark gradient, deep navy to black, subtle gold vignette, smooth, modern ui background, 8k, no text', 'landscape_4_3') },
      { id: 'soft-waves', url: img('abstract soft waves, dark background, subtle gold highlight, premium minimal composition, ultra realistic, 8k, no text'), thumb: img('abstract soft waves, dark background, subtle gold highlight, premium minimal composition, ultra realistic, 8k, no text', 'landscape_4_3') },
      { id: 'matte-tiles', url: img('minimal matte black tiles, soft shadow, subtle gold rim light, premium architectural, ultra realistic, 8k, no text'), thumb: img('minimal matte black tiles, soft shadow, subtle gold rim light, premium architectural, ultra realistic, 8k, no text', 'landscape_4_3') },
      { id: 'ink-silk', url: img('macro ink in water, dark navy, subtle gold shimmer, minimal, cinematic, ultra realistic, 8k, no text'), thumb: img('macro ink in water, dark navy, subtle gold shimmer, minimal, cinematic, ultra realistic, 8k, no text', 'landscape_4_3') },
      { id: 'mono-curve', url: img('minimal modern 3d curve, matte black surface, soft gold edge light, clean composition, premium, 8k, no text'), thumb: img('minimal modern 3d curve, matte black surface, soft gold edge light, clean composition, premium, 8k, no text', 'landscape_4_3') }
    ]
  },
  {
    id: 'tech',
    name: 'Tech',
    wallpapers: [
      { id: 'server-aisle', url: img('cinematic server room aisle, dark, subtle gold indicator lights, ultra realistic, premium tech, 8k, no text'), thumb: img('cinematic server room aisle, dark, subtle gold indicator lights, ultra realistic, premium tech, 8k, no text', 'landscape_4_3') },
      { id: 'circuit-gold', url: img('macro circuit board, dark matte, subtle gold traces, clean, premium, ultra realistic, 8k, no text'), thumb: img('macro circuit board, dark matte, subtle gold traces, clean, premium, ultra realistic, 8k, no text', 'landscape_4_3') },
      { id: 'hud-minimal', url: img('minimal sci fi hud lines, dark navy background, subtle gold glow, clean ui background, premium, 8k, no text'), thumb: img('minimal sci fi hud lines, dark navy background, subtle gold glow, clean ui background, premium, 8k, no text', 'landscape_4_3') },
      { id: 'neon-matrix', url: img('abstract neon matrix grid, dark background, subtle gold and cyan lights, modern, premium, 8k, no text'), thumb: img('abstract neon matrix grid, dark background, subtle gold and cyan lights, modern, premium, 8k, no text', 'landscape_4_3') },
      { id: 'code-rain', url: img('abstract digital rain, dark background, subtle gold highlights, minimal, premium tech aesthetic, 8k, no text'), thumb: img('abstract digital rain, dark background, subtle gold highlights, minimal, premium tech aesthetic, 8k, no text', 'landscape_4_3') },
      { id: 'hologram-cube', url: img('minimal hologram cube, dark background, soft gold glow, cinematic, premium, ultra realistic, 8k, no text'), thumb: img('minimal hologram cube, dark background, soft gold glow, cinematic, premium, ultra realistic, 8k, no text', 'landscape_4_3') }
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
      url: (DESIGN_STUDIO_WALLPAPER_STATIC_MAP && DESIGN_STUDIO_WALLPAPER_STATIC_MAP[w.id] && DESIGN_STUDIO_WALLPAPER_STATIC_MAP[w.id].url) ? DESIGN_STUDIO_WALLPAPER_STATIC_MAP[w.id].url : w.url,
      thumb: (DESIGN_STUDIO_WALLPAPER_STATIC_MAP && DESIGN_STUDIO_WALLPAPER_STATIC_MAP[w.id] && DESIGN_STUDIO_WALLPAPER_STATIC_MAP[w.id].thumb) ? DESIGN_STUDIO_WALLPAPER_STATIC_MAP[w.id].thumb : (w.thumb || w.url)
    }))
  );
  if (!target || target === 'all') return list;
  return list.filter((w) => w.category === target);
}
