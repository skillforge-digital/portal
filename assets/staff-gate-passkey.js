import { db } from './firebase-config.js';
import { PassCodeEngine } from './pass-code-engine.js';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js';

export async function createOrGetStaffGatePasskey({ uid, sfid, force = false }) {
  if (!uid) throw new Error('Missing UID');

  const staffRef = doc(db, 'staffs', uid);
  const snap = await getDoc(staffRef).catch(() => null);
  if (!snap || !snap.exists()) throw new Error('Staff profile not found');

  const profile = snap.data() || {};
  const currentPin = profile.pin ? String(profile.pin).trim() : '';
  if (!force && /^\d{6}$/.test(currentPin)) return { pin: currentPin, profile };

  const status = String(profile.status || '').trim().toLowerCase();
  if (status !== 'active') throw new Error('Your clearance is not active yet.');

  const resolvedSfid = sfid || profile.sfid || '';
  for (let i = 0; i < 20; i++) {
    const pin = PassCodeEngine.generate();
    const accessRef = doc(db, 'track_access', pin);
    const accessSnap = await getDoc(accessRef).catch(() => null);
    if (accessSnap && accessSnap.exists()) continue;

    await setDoc(accessRef, {
      pin,
      track: 'Staff Access',
      uid,
      sfid: resolvedSfid,
      type: 'staff',
      status: 'active',
      created_at: serverTimestamp()
    });
    await updateDoc(staffRef, { pin });
    return { pin, profile: { ...profile, pin } };
  }

  throw new Error('Passkey generation failed. Retry.');
}
