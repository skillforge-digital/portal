import { auth, db } from './firebase-config.js';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js';
import { resolveStaffIdentity } from './staff-identity.js';
import { PassCodeEngine } from './pass-code-engine.js';

function getUid() {
  return auth.currentUser?.uid || localStorage.getItem('skillforge_mock_uid') || null;
}

function shouldInstallOnPath(pathname) {
  const path = String(pathname || '');
  if (!path.includes('/staffs/')) return false;
  if (path.includes('/staffs/login') || path.includes('/staffs/registration') || path.includes('/staffs/role-gateway')) return false;
  return true;
}

function normalizePin(value) {
  const pin = String(value || '').trim();
  return /^\d{6}$/.test(pin) ? pin : '';
}

async function writeProfilePin(uid, pin) {
  const refs = [
    doc(db, 'staffs', uid),
    doc(db, 'directors', uid),
    doc(db, 'hods', uid),
    doc(db, 'specialists', uid)
  ];

  for (const ref of refs) {
    const snap = await getDoc(ref).catch(() => null);
    if (snap && snap.exists()) {
      await updateDoc(ref, {
        pin,
        staffAccessCode: pin,
        universalTrackAccess: true,
        updated_at: serverTimestamp()
      });
      return;
    }
  }
}

async function ensureTrackAccessPin(uid, sfid, pin) {
  const ref = doc(db, 'track_access', pin);
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  await setDoc(ref, {
    pin,
    track: 'Staff Access',
    uid,
    sfid: String(sfid || '').trim(),
    type: 'staff',
    status: 'active',
    created_at: serverTimestamp()
  }, { merge: true });
}

export async function getOrCreateStaffAccessCode() {
  const uid = getUid();
  if (!uid) throw new Error('Identity missing. Please sign in again.');

  const resolved = await resolveStaffIdentity(uid);
  if (!resolved.found || !resolved.profile) throw new Error('Staff profile missing. Please sign in again.');

  const existing = normalizePin(resolved.profile.staffAccessCode || resolved.profile.pin);
  if (existing) {
    await ensureTrackAccessPin(uid, resolved.profile.sfid, existing);
    return existing;
  }

  let pin = '';
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = PassCodeEngine.generate();
    const snap = await getDoc(doc(db, 'track_access', candidate));
    if (!snap.exists()) {
      pin = candidate;
      break;
    }
  }
  if (!pin) throw new Error('Unable to generate a unique access code. Retry.');

  await ensureTrackAccessPin(uid, resolved.profile.sfid, pin);
  await writeProfilePin(uid, pin);
  return pin;
}

function closeModal() {
  document.getElementById('staff-access-code-modal')?.remove();
  const handler = window.__sf_staff_access_code_esc_handler;
  if (typeof handler === 'function') {
    window.removeEventListener('keydown', handler, true);
  }
  window.__sf_staff_access_code_esc_handler = null;
}

function showModal(pin) {
  closeModal();
  const modal = document.createElement('div');
  modal.id = 'staff-access-code-modal';
  modal.className = 'fixed inset-0 z-[350] bg-navy/90 flex items-center justify-center p-6 backdrop-blur-xl';
  modal.style.position = 'fixed';
  modal.style.inset = '0';
  modal.style.zIndex = '2147482000';
  modal.style.pointerEvents = 'auto';
  modal.style.touchAction = 'manipulation';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.padding = '24px';
  modal.style.background = 'rgba(4, 12, 25, 0.9)';
  modal.style.backdropFilter = 'blur(18px)';
  modal.innerHTML = `
    <div class="glass-strong p-10 rounded-[48px] border border-white/10 max-w-sm w-full text-center space-y-8" style="pointer-events: auto; position: relative; z-index: 2147482001;">
      <div>
        <p class="text-[8px] font-black text-gold uppercase tracking-[0.4em]">Main Site Gate</p>
        <h2 class="text-2xl font-black uppercase tracking-tighter">Access Code</h2>
        <p class="text-[10px] text-white/40 uppercase tracking-widest mt-2">Universal unlock</p>
      </div>

      <div class="p-6 rounded-3xl bg-white/5 border border-white/10">
        <p class="font-mono font-black text-4xl tracking-[0.2em] text-gold select-all">${pin}</p>
      </div>

      <div class="flex flex-col gap-3">
        <button id="staff-access-copy" class="w-full py-4 rounded-2xl bg-gold text-navy-950 text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all" style="pointer-events: auto;">
          Copy Code
        </button>
        <button id="staff-access-dismiss" class="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all" style="pointer-events: auto;">
          Dismiss
        </button>
      </div>
    </div>
  `;
  (document.documentElement || document.body).appendChild(modal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  modal.querySelector('#staff-access-dismiss')?.addEventListener('click', () => closeModal());
  window.__sf_staff_access_code_esc_handler = (e) => {
    if (e?.key === 'Escape') closeModal();
  };
  window.addEventListener('keydown', window.__sf_staff_access_code_esc_handler, true);
  modal.querySelector('#staff-access-copy')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(pin);
      const btn = document.getElementById('staff-access-copy');
      if (btn) btn.textContent = 'Copied';
      setTimeout(() => {
        const btn2 = document.getElementById('staff-access-copy');
        if (btn2) btn2.textContent = 'Copy Code';
      }, 1500);
    } catch (e) {
      alert('Unable to copy automatically. Select and copy the code manually.');
    }
  });
  if (window.lucide) window.lucide.createIcons();
}

async function handleClick(btn) {
  if (!btn) return;
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = 'Generating...';
  try {
    const pin = await getOrCreateStaffAccessCode();
    showModal(pin);
  } catch (e) {
    alert(e?.message || 'Failed to generate access code.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = original;
    if (window.lucide) window.lucide.createIcons();
  }
}

export function installStaffAccessCodeButton(options = {}) {
  const path = window.location.pathname || '';
  const shouldInstall = shouldInstallOnPath(path);
  const existing = document.getElementById('staff-access-code-btn');
  if (!shouldInstall) {
    existing?.remove();
    closeModal();
    return;
  }
  if (existing) return;

  const btn = document.createElement('button');
  btn.id = 'staff-access-code-btn';
  btn.type = 'button';
  btn.className = options.className || 'fixed bottom-6 right-6 z-[200] bg-gold text-navy-950 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-4K hover:bg-white transition-all flex items-center gap-2';
  btn.style.position = 'fixed';
  btn.style.zIndex = String(options.zIndex || 2147482500);
  btn.style.right = 'calc(env(safe-area-inset-right, 0px) + 24px)';
  btn.style.bottom = 'calc(env(safe-area-inset-bottom, 0px) + 24px)';
  btn.style.pointerEvents = 'auto';
  btn.style.touchAction = 'manipulation';
  btn.innerHTML = `<i data-lucide="key" class="w-4 h-4"></i> Get Access Code`;
  btn.addEventListener('click', () => void handleClick(btn));
  (document.documentElement || document.body).appendChild(btn);
  if (window.lucide) window.lucide.createIcons();
}

if (!window.__sf_staff_access_code_installed) {
  window.__sf_staff_access_code_installed = true;
  const installRouteWatcher = () => {
    if (window.__sf_staff_access_code_route_watcher_installed) return;
    window.__sf_staff_access_code_route_watcher_installed = true;
    let lastPath = window.location.pathname || '';
    const onRouteChange = () => {
      const nextPath = window.location.pathname || '';
      if (nextPath === lastPath) return;
      lastPath = nextPath;
      closeModal();
      installStaffAccessCodeButton();
    };
    window.addEventListener('popstate', onRouteChange);
    for (const method of ['pushState', 'replaceState']) {
      const original = history[method];
      if (typeof original !== 'function') continue;
      history[method] = function (...args) {
        const result = original.apply(this, args);
        setTimeout(onRouteChange, 0);
        return result;
      };
    }
  };
  const boot = () => {
    installRouteWatcher();
    installStaffAccessCodeButton();
  };
  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', boot);
  else boot();
  window.addEventListener('sf:turbo-render', boot);
}
