function normalizeRole(role) {
  const v = String(role || '').trim();
  if (!v) return '';
  if (v.toLowerCase() === 'support staff') return 'Support Team';
  if (v.toLowerCase() === 'support staff / team') return 'Support Team';
  return v;
}

function uniq(list) {
  return Array.from(new Set((Array.isArray(list) ? list : []).map(normalizeRole).filter(Boolean)));
}

function randomDigits(len) {
  const max = Math.pow(10, len) - 1;
  const min = Math.pow(10, len - 1);
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
}

export function buildStaffRoleCode(roles) {
  const r = uniq(roles);
  const isDirector = r.includes('Director');
  const isHod = r.includes('HOD');
  const isSpec = r.includes('Specialist');
  const isMarketing = r.includes('Digital Marketing');
  const isCommunity = r.includes('Community Manager');
  const isSupport = r.includes('Support Team');

  let prefix = 'STF';
  let digits = 3;

  if (isDirector) {
    prefix = 'DIR';
    digits = 4;
  } else if (isHod && isSpec) {
    prefix = 'HSPEC';
  } else if (isSpec) {
    prefix = 'SPEC';
  } else if (isMarketing) {
    prefix = 'DMT';
  } else if (isCommunity) {
    prefix = 'CM';
  } else if (isSupport) {
    prefix = 'SUP';
  }

  const code = `SKF-${prefix}-${randomDigits(digits)}`;
  return { code, roles: r };
}

export function buildCodeHint(code) {
  const v = String(code || '').trim();
  if (v.length <= 10) return v;
  return `${v.slice(0, 7)}...${v.slice(-3)}`;
}
