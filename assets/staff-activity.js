import { db, auth } from './firebase-config.js';
import { addDoc, collection, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js';
import { resolveStaffIdentity } from './staff-identity.js';

const ROLE_TO_UNIT = {
  Director: 'director',
  HOD: 'hod',
  Specialist: 'specialist',
  'Digital Marketing': 'marketing',
  'Support Staff': 'support'
};

export async function logStaffActivity({ action, details, scope, targetUid, targetType }) {
  const uid = auth.currentUser ? auth.currentUser.uid : localStorage.getItem('skillforge_mock_uid');
  if (!uid) return false;

  const resolved = await resolveStaffIdentity(uid);
  if (!resolved.found) return false;
  const actorRole = resolved.profile?.primaryRole || (Array.isArray(resolved.profile?.roles) ? resolved.profile.roles[0] : undefined) || 'Staff';
  const actorName = resolved.profile?.name || auth.currentUser?.email || 'Unknown';
  const unit = ROLE_TO_UNIT[actorRole] || 'global';

  const entry = {
    timestamp: serverTimestamp(),
    action: action || 'UNKNOWN',
    scope: scope || 'global',
    details: details ? (typeof details === 'object' ? JSON.stringify(details) : String(details)) : '',
    actorUid: uid,
    actorName,
    actorRole,
    actorUnit: unit,
    targetUid: targetUid || '',
    targetType: targetType || ''
  };

  try {
    await addDoc(collection(db, 'staff_activity_global'), entry);
    await addDoc(collection(db, 'staff_activity_units', unit, 'entries'), entry);
    return true;
  } catch (err) {
    void(err);
    return false;
  }
}
