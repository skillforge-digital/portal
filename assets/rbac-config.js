/**
 * SkillForge RBAC Configuration (v3.0.0)
 * Defines the permission matrix for cumulative roles.
 */

export const ROLES = {
    DIRECTOR: 'Director',
    HOD: 'HOD',
    SPECIALIST: 'Specialist',
    DIGITAL_MARKETING: 'Digital Marketing',
    COMMUNITY_MANAGER: 'Community Manager',
    SUPPORT_TEAM: 'Support Team',
    STAFF: 'Staff',
    TRAINEE: 'Trainee'
};

export const PERMISSIONS = {
    ACCESS_DIRECTOR_CENTER: 'access_director_center',
    ACCESS_HOD_CENTER: 'access_hod_center',
    ACCESS_SPECIALIST_CENTER: 'access_specialist_center',
    MANAGE_STAFF: 'manage_staff',
    MANAGE_TRAINEES: 'manage_trainees',
    MANAGE_COURSES: 'manage_courses',
    VIEW_ANALYTICS: 'view_analytics',
    EDIT_SYSTEM_CONFIG: 'edit_system_config',
    PERFORM_AUDIT: 'perform_audit',
    GIVE_BADGES: 'give_badges',
    GLOBAL_ANNOUNCEMENT: 'global_announcement',
    START_END_SEASON: 'start_end_season',
    MAINTENANCE_MODE: 'maintenance_mode',
    CREATE_ROLES: 'create_roles',
    EDIT_REGISTRATION_DATES: 'edit_registration_dates',
    PRIORITY_SUPPORT: 'priority_support'
};

export const ROLE_PERMISSIONS = {
    [ROLES.DIRECTOR]: [
        PERMISSIONS.ACCESS_DIRECTOR_CENTER,
        PERMISSIONS.ACCESS_HOD_CENTER,
        PERMISSIONS.ACCESS_SPECIALIST_CENTER,
        PERMISSIONS.MANAGE_STAFF,
        PERMISSIONS.MANAGE_TRAINEES,
        PERMISSIONS.MANAGE_COURSES,
        PERMISSIONS.VIEW_ANALYTICS,
        PERMISSIONS.EDIT_SYSTEM_CONFIG,
        PERMISSIONS.PERFORM_AUDIT,
        PERMISSIONS.GIVE_BADGES,
        PERMISSIONS.GLOBAL_ANNOUNCEMENT,
        PERMISSIONS.START_END_SEASON,
        PERMISSIONS.MAINTENANCE_MODE,
        PERMISSIONS.CREATE_ROLES,
        PERMISSIONS.EDIT_REGISTRATION_DATES
    ],
    [ROLES.HOD]: [
        PERMISSIONS.ACCESS_HOD_CENTER,
        PERMISSIONS.ACCESS_SPECIALIST_CENTER,
        PERMISSIONS.MANAGE_TRAINEES,
        PERMISSIONS.MANAGE_COURSES,
        PERMISSIONS.VIEW_ANALYTICS,
        PERMISSIONS.GIVE_BADGES
        // Removed suspension permission if it existed
    ],
    [ROLES.SPECIALIST]: [
        PERMISSIONS.ACCESS_SPECIALIST_CENTER,
        PERMISSIONS.MANAGE_TRAINEES,
        PERMISSIONS.VIEW_ANALYTICS,
        PERMISSIONS.GIVE_BADGES
    ],
    [ROLES.DIGITAL_MARKETING]: [
        PERMISSIONS.VIEW_ANALYTICS,
        PERMISSIONS.ACCESS_SPECIALIST_CENTER,
        PERMISSIONS.GLOBAL_ANNOUNCEMENT // Digital marketing can also announce
    ],
    [ROLES.COMMUNITY_MANAGER]: [
        PERMISSIONS.ACCESS_SPECIALIST_CENTER,
        PERMISSIONS.MANAGE_TRAINEES,
        PERMISSIONS.GIVE_BADGES,
        PERMISSIONS.PRIORITY_SUPPORT,
        PERMISSIONS.MANAGE_TRAINEES // CM can fix profile issues
    ],
    [ROLES.SUPPORT_TEAM]: [
        PERMISSIONS.ACCESS_SPECIALIST_CENTER,
        PERMISSIONS.VIEW_ANALYTICS,
        PERMISSIONS.PRIORITY_SUPPORT
    ],
    [ROLES.STAFF]: [
        PERMISSIONS.VIEW_ANALYTICS
    ],
    [ROLES.TRAINEE]: []
};

/**
 * Checks if a user has a specific permission based on their roles.
 * @param {string[]} userRoles 
 * @param {string} permission 
 * @returns {boolean}
 */
export function hasPermission(userRoles, permission) {
    if (!userRoles || !Array.isArray(userRoles)) return false;
    
    // Director has all permissions (Master Override)
    if (userRoles.includes(ROLES.DIRECTOR)) return true;

    return userRoles.some(role => {
        const permissions = ROLE_PERMISSIONS[role] || [];
        return permissions.includes(permission);
    });
}

/**
 * Gets all unique permissions for a set of roles.
 * @param {string[]} userRoles 
 * @returns {string[]}
 */
export function getCumulativePermissions(userRoles) {
    if (!userRoles || !Array.isArray(userRoles)) return [];
    
    const permissions = new Set();
    userRoles.forEach(role => {
        (ROLE_PERMISSIONS[role] || []).forEach(p => permissions.add(p));
    });
    return Array.from(permissions);
}
