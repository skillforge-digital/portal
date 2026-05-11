const STAFF_DASHBOARD_PATH_BY_ROLE = {
    Director: '/staffs/director/',
    HOD: '/staffs/hod/',
    Specialist: '/staffs/specialist/',
    'Digital Marketing': '/staffs/marketing/',
    'Support Staff': '/staffs/support/'
};

const ROLE_ALIASES = {
    'Support Team': 'Support Staff',
    'Support Staff / Team': 'Support Staff'
};

function normalizeRole(role) {
    const raw = String(role || '').trim();
    return ROLE_ALIASES[raw] || raw;
}

function normalizeRoles(rolesRaw) {
    const roles = Array.isArray(rolesRaw) ? rolesRaw : [rolesRaw].filter(Boolean);
    return roles.map(normalizeRole).filter(Boolean);
}

const LEGACY_ROLE_BY_COLLECTION = {
    directors: 'Director',
    hods: 'HOD',
    specialists: 'Specialist'
};

export async function resolveStaffIdentity(uid) {
    const [{ db }, { doc, getDoc }] = await Promise.all([
        import('./firebase-config.js'),
        import('https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js')
    ]);

    const refs = [
        { collection: 'staffs', ref: doc(db, 'staffs', uid) },
        { collection: 'directors', ref: doc(db, 'directors', uid) },
        { collection: 'hods', ref: doc(db, 'hods', uid) },
        { collection: 'specialists', ref: doc(db, 'specialists', uid) }
    ];

    for (const entry of refs) {
        let snap;
        try {
            snap = await getDoc(entry.ref);
        } catch (err) {
            const msg = (err && typeof err.message === 'string' ? err.message : '').toLowerCase();
            const code = (err && typeof err.code === 'string' ? err.code : '').toLowerCase();
            const offline = !navigator.onLine || msg.includes('client is offline') || msg.includes('offline') || code.includes('unavailable');
            return { found: false, source: 'none', profile: null, offline, error: err };
        }
        if (!snap.exists()) continue;

        const data = snap.data() || {};
        const legacyRole = LEGACY_ROLE_BY_COLLECTION[entry.collection];

        const rolesRaw = data.roles ?? (data.primaryRole ? [data.primaryRole] : (data.role ? [data.role] : (legacyRole ? [legacyRole] : [])));
        const roles = normalizeRoles(rolesRaw);

        const primaryRoleRaw = data.primaryRole || data.role || legacyRole || roles[0] || 'Staff';
        const primaryRole = normalizeRole(primaryRoleRaw) || roles[0] || 'Staff';
        const status = entry.collection === 'staffs' ? (data.status || 'unknown') : (data.status || 'active');

        return {
            found: true,
            source: entry.collection,
            profile: {
                ...data,
                roles,
                primaryRole,
                status
            }
        };
    }

    return { found: false, source: 'none', profile: null };
}

export function getStaffDashboardPath(profile) {
    const roleRaw = profile?.primaryRole || profile?.role || (Array.isArray(profile?.roles) ? profile.roles[0] : undefined);
    const role = normalizeRole(roleRaw);
    return STAFF_DASHBOARD_PATH_BY_ROLE[role] || '/staffs/';
}

export function getAllStaffDashboardPaths(profile) {
    const roles = Array.isArray(profile?.roles) ? profile.roles : [];
    return roles
        .filter(Boolean)
        .map((r) => {
            const normalized = normalizeRole(r);
            return { role: normalized, path: STAFF_DASHBOARD_PATH_BY_ROLE[normalized] };
        })
        .filter((x) => Boolean(x.path));
}
