const kw = (s) => encodeURIComponent(String(s || '').trim());

const PICSUM_MAP = {'forest,mist':'10','mountain,dawn':'15','waterfall,cinematic':'20','desert,night':'25','aurora,borealis':'30','jungle,canopy':'35','noir,city,night':'40','black,marble,texture':'45','carbon,fiber,texture':'50','obsidian,stone,texture':'55','neon,haze,dark':'60','dark,grid,futuristic':'65','anime,neo tokyo':'70','anime,sakura,night':'71','anime,cyberpunk,street':'72','anime,samurai,moon':'73','anime,mecha':'74','anime,starry sky':'75','minimal,gradient':'80','paper,texture,minimal':'85','minimal,white,desk':'90','matte,black,minimal':'95','minimal,lines':'100','minimal,3d,curve':'101','abstract,fluid':'110','ink,water,abstract':'115','abstract,neon':'120','geometric,abstract':'125','abstract,waves':'130','smoke,abstract':'135','space,nebula':'140','ringed,planet,space':'141','moon,surface,space':'142','astronaut,space':'143','star,trails,night':'144','galaxy,deep space':'145','city,skyline,night':'150','city,rain,street':'155','neon,signs,city':'160','modern,architecture,city':'165','subway,station':'170','night,drive,city':'175','ocean,waves':'180','deep,blue,ocean':'185','tropical,ocean':'190','ocean,sunset':'195','underwater,ocean':'196','coastline,sea':'197'};
const u = (keyword) => `https://picsum.photos/seed/${PICSUM_MAP[keyword] || Math.abs(keyword.split('').reduce((a,c)=>a+c.charCodeAt(0),0))}/1920/1080`;
const t = (keyword) => `https://picsum.photos/seed/${PICSUM_MAP[keyword] || Math.abs(keyword.split('').reduce((a,c)=>a+c.charCodeAt(0),0))}/400/300`;

export const WALLPAPER_CATEGORIES = [
  { id: 'nature', name: 'Nature', mood: 'nature' },
  { id: 'dark', name: 'Dark', mood: 'dark' },
  { id: 'anime', name: 'Anime', mood: 'anime' },
  { id: 'minimal', name: 'Minimal', mood: 'minimal' },
  { id: 'abstract', name: 'Abstract', mood: 'abstract' },
  { id: 'space', name: 'Space', mood: 'space' },
  { id: 'city', name: 'City', mood: 'city' },
  { id: 'ocean', name: 'Ocean', mood: 'ocean' }
];

export const WALLPAPER_LIBRARY = [
  { id: 'nature-forest-mist', name: 'Forest Mist', category: 'nature', mood: 'nature', url: u('forest,mist'), thumb: t('forest,mist') },
  { id: 'nature-mountain-dawn', name: 'Mountain Dawn', category: 'nature', mood: 'nature', url: u('mountain,dawn'), thumb: t('mountain,dawn') },
  { id: 'nature-waterfall', name: 'Waterfall', category: 'nature', mood: 'nature', url: u('waterfall,cinematic'), thumb: t('waterfall,cinematic') },
  { id: 'nature-desert-night', name: 'Desert Night', category: 'nature', mood: 'nature', url: u('desert,night'), thumb: t('desert,night') },
  { id: 'nature-aurora', name: 'Aurora', category: 'nature', mood: 'nature', url: u('aurora,borealis'), thumb: t('aurora,borealis') },
  { id: 'nature-jungle', name: 'Jungle', category: 'nature', mood: 'nature', url: u('jungle,canopy'), thumb: t('jungle,canopy') },

  { id: 'dark-noir-city', name: 'Noir City', category: 'dark', mood: 'dark', url: u('noir,city,night'), thumb: t('noir,city,night') },
  { id: 'dark-black-marble', name: 'Black Marble', category: 'dark', mood: 'dark', url: u('black,marble,texture'), thumb: t('black,marble,texture') },
  { id: 'dark-carbon-fiber', name: 'Carbon Fiber', category: 'dark', mood: 'dark', url: u('carbon,fiber,texture'), thumb: t('carbon,fiber,texture') },
  { id: 'dark-obsidian', name: 'Obsidian', category: 'dark', mood: 'dark', url: u('obsidian,stone,texture'), thumb: t('obsidian,stone,texture') },
  { id: 'dark-neon-haze', name: 'Neon Haze', category: 'dark', mood: 'dark', url: u('neon,haze,dark'), thumb: t('neon,haze,dark') },
  { id: 'dark-shadow-grid', name: 'Shadow Grid', category: 'dark', mood: 'dark', url: u('dark,grid,futuristic'), thumb: t('dark,grid,futuristic') },

  { id: 'anime-neo-tokyo', name: 'Neo Tokyo', category: 'anime', mood: 'anime', url: u('anime,neo tokyo'), thumb: t('anime,neo tokyo') },
  { id: 'anime-sakura-night', name: 'Sakura Night', category: 'anime', mood: 'anime', url: u('anime,sakura,night'), thumb: t('anime,sakura,night') },
  { id: 'anime-cyber-street', name: 'Cyber Street', category: 'anime', mood: 'anime', url: u('anime,cyberpunk,street'), thumb: t('anime,cyberpunk,street') },
  { id: 'anime-samurai', name: 'Samurai', category: 'anime', mood: 'anime', url: u('anime,samurai,moon'), thumb: t('anime,samurai,moon') },
  { id: 'anime-mecha', name: 'Mecha', category: 'anime', mood: 'anime', url: u('anime,mecha'), thumb: t('anime,mecha') },
  { id: 'anime-starry-sky', name: 'Starry Sky', category: 'anime', mood: 'anime', url: u('anime,starry sky'), thumb: t('anime,starry sky') },

  { id: 'minimal-soft-gradient', name: 'Soft Gradient', category: 'minimal', mood: 'minimal', url: u('minimal,gradient'), thumb: t('minimal,gradient') },
  { id: 'minimal-paper', name: 'Paper Texture', category: 'minimal', mood: 'minimal', url: u('paper,texture,minimal'), thumb: t('paper,texture,minimal') },
  { id: 'minimal-white-space', name: 'White Space', category: 'minimal', mood: 'minimal', url: u('minimal,white,desk'), thumb: t('minimal,white,desk') },
  { id: 'minimal-matte-black', name: 'Matte Black', category: 'minimal', mood: 'minimal', url: u('matte,black,minimal'), thumb: t('matte,black,minimal') },
  { id: 'minimal-lines', name: 'Clean Lines', category: 'minimal', mood: 'minimal', url: u('minimal,lines'), thumb: t('minimal,lines') },
  { id: 'minimal-mono-curve', name: 'Mono Curve', category: 'minimal', mood: 'minimal', url: u('minimal,3d,curve'), thumb: t('minimal,3d,curve') },

  { id: 'abstract-fluid', name: 'Fluid Abstract', category: 'abstract', mood: 'abstract', url: u('abstract,fluid'), thumb: t('abstract,fluid') },
  { id: 'abstract-ink', name: 'Ink Cloud', category: 'abstract', mood: 'abstract', url: u('ink,water,abstract'), thumb: t('ink,water,abstract') },
  { id: 'abstract-neon', name: 'Neon Abstract', category: 'abstract', mood: 'abstract', url: u('abstract,neon'), thumb: t('abstract,neon') },
  { id: 'abstract-geometric', name: 'Geometric', category: 'abstract', mood: 'abstract', url: u('geometric,abstract'), thumb: t('geometric,abstract') },
  { id: 'abstract-waves', name: 'Waves', category: 'abstract', mood: 'abstract', url: u('abstract,waves'), thumb: t('abstract,waves') },
  { id: 'abstract-smoke', name: 'Smoke', category: 'abstract', mood: 'abstract', url: u('smoke,abstract'), thumb: t('smoke,abstract') },

  { id: 'space-nebula', name: 'Nebula', category: 'space', mood: 'space', url: u('space,nebula'), thumb: t('space,nebula') },
  { id: 'space-ringed-planet', name: 'Ringed Planet', category: 'space', mood: 'space', url: u('ringed,planet,space'), thumb: t('ringed,planet,space') },
  { id: 'space-moon', name: 'Moon Surface', category: 'space', mood: 'space', url: u('moon,surface,space'), thumb: t('moon,surface,space') },
  { id: 'space-astronaut', name: 'Astronaut', category: 'space', mood: 'space', url: u('astronaut,space'), thumb: t('astronaut,space') },
  { id: 'space-star-trails', name: 'Star Trails', category: 'space', mood: 'space', url: u('star,trails,night'), thumb: t('star,trails,night') },
  { id: 'space-galaxy', name: 'Galaxy', category: 'space', mood: 'space', url: u('galaxy,deep space'), thumb: t('galaxy,deep space') },

  { id: 'city-skyline', name: 'Skyline', category: 'city', mood: 'city', url: u('city,skyline,night'), thumb: t('city,skyline,night') },
  { id: 'city-rain', name: 'Rain Street', category: 'city', mood: 'city', url: u('city,rain,street'), thumb: t('city,rain,street') },
  { id: 'city-neon', name: 'Neon Signs', category: 'city', mood: 'city', url: u('neon,signs,city'), thumb: t('neon,signs,city') },
  { id: 'city-architecture', name: 'Architecture', category: 'city', mood: 'city', url: u('modern,architecture,city'), thumb: t('modern,architecture,city') },
  { id: 'city-subway', name: 'Subway', category: 'city', mood: 'city', url: u('subway,station'), thumb: t('subway,station') },
  { id: 'city-night-drive', name: 'Night Drive', category: 'city', mood: 'city', url: u('night,drive,city'), thumb: t('night,drive,city') },

  { id: 'ocean-waves', name: 'Ocean Waves', category: 'ocean', mood: 'ocean', url: u('ocean,waves'), thumb: t('ocean,waves') },
  { id: 'ocean-deep-blue', name: 'Deep Blue', category: 'ocean', mood: 'ocean', url: u('deep,blue,ocean'), thumb: t('deep,blue,ocean') },
  { id: 'ocean-tropical', name: 'Tropical Water', category: 'ocean', mood: 'ocean', url: u('tropical,ocean'), thumb: t('tropical,ocean') },
  { id: 'ocean-sunset', name: 'Ocean Sunset', category: 'ocean', mood: 'ocean', url: u('ocean,sunset'), thumb: t('ocean,sunset') },
  { id: 'ocean-underwater', name: 'Underwater', category: 'ocean', mood: 'ocean', url: u('underwater,ocean'), thumb: t('underwater,ocean') },
  { id: 'ocean-coast', name: 'Coastline', category: 'ocean', mood: 'ocean', url: u('coastline,sea'), thumb: t('coastline,sea') }
];

export function getWallpapers(categoryId) {
  const target = String(categoryId || '').trim();
  const list = Array.isArray(WALLPAPER_LIBRARY) ? WALLPAPER_LIBRARY : [];
  if (!target || target === 'all') return list;
  return list.filter((w) => w.category === target);
}
