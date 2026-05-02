export const TRACK_TELEGRAM_NODES = {
  'Forex Synthetics Indices': 'https://t.me/+KWyN-sKQNMExZjg8',
  'Forex Currency Pairs': 'https://t.me/+9cAdAp2Pw_FjNmJk',
  'AI Content Creation': 'https://t.me/+I5vUYuIuaMw4N2Rk',
  'Photography & Editing': 'https://t.me/+mkRAltkqJd41YTE0',
  'Graphic Design': 'https://t.me/+PTJq2zoyz0M3ZDZk',
  'Digital Marketing': 'https://t.me/+uIkOfw5x2MpmNjI0',
  'Mobile Cinematography': 'https://t.me/+un1weOJ0HcsyZDdk',
  'Discord Development': 'https://t.me/+Y5wcP_PIQf1kMzlk',
  'Web Development': 'https://t.me/+vEJTv3fBRl43Yjlk',
  'Cyber Security': 'https://t.me/+M4ZYMfz5tiYzZWVk'
};

export function getTelegramLinkForTrack(track) {
  return TRACK_TELEGRAM_NODES[String(track || '')] || 'https://t.me/skillforgeorg';
}

export function normalizePhone(input) {
  const raw = String(input || '').trim();
  const digits = raw.replace(/[^\d]/g, '');
  if (digits.startsWith('0')) return `234${digits.slice(1)}`;
  if (digits.startsWith('234')) return digits;
  return digits;
}

export function buildWhatsappMessage({ name, track, telegramLink }) {
  const safeName = String(name || 'Trainee').trim();
  const safeTrack = String(track || '').trim();
  const tg = String(telegramLink || '').trim();
  return [
    `Congratulations ${safeName} — welcome to SkillForge Digital & Co. Ltd.`,
    `Your track: ${safeTrack}.`,
    '',
    `Join your official track Telegram group now: ${tg}`,
    '',
    'Next step: introduce yourself (name + track) in the group and wait for onboarding tasks.',
    'Please save this contact for further assistance.'
  ].join('\n');
}

export function buildWhatsappLink({ phone, text }) {
  const p = normalizePhone(phone);
  const t = encodeURIComponent(String(text || ''));
  return `https://wa.me/${p}?text=${t}`;
}
