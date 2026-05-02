const STAFF_DASHBOARD_PATH_BY_ROLE = {
    Director: '/staffs/director/',
    HOD: '/staffs/hod/',
    Specialist: '/staffs/specialist/',
    'Digital Marketing': '/staffs/marketing/',
    'Support Staff': '/staffs/support/'
};

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
            const offline = !navigator.onLine || (err && typeof err.message === 'string' && err.message.toLowerCase().includes('offline'));
            return { found: false, source: 'none', profile: null, offline, error: err };
        }
        if (!snap.exists()) continue;

        const data = snap.data() || {};
        const legacyRole = LEGACY_ROLE_BY_COLLECTION[entry.collection];

        const rolesRaw = data.roles ?? (data.primaryRole ? [data.primaryRole] : (data.role ? [data.role] : (legacyRole ? [legacyRole] : [])));
        const roles = Array.isArray(rolesRaw) ? rolesRaw : [rolesRaw].filter(Boolean);

        const primaryRole = data.primaryRole || data.role || legacyRole || roles[0] || 'Staff';
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
    const role = profile?.primaryRole || profile?.role || (Array.isArray(profile?.roles) ? profile.roles[0] : undefined);
    return STAFF_DASHBOARD_PATH_BY_ROLE[role] || '/staffs/';
}

export function getAllStaffDashboardPaths(profile) {
    const roles = Array.isArray(profile?.roles) ? profile.roles : [];
    return roles
        .filter(Boolean)
        .map((r) => ({ role: r, path: STAFF_DASHBOARD_PATH_BY_ROLE[r] }))
        .filter((x) => Boolean(x.path));
}
