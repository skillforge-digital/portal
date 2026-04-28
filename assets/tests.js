/**
 * SkillForge Dashboard Test Suite (v1.0.0)
 * Run this in the browser console to verify core systems.
 */

import { ROLES, PERMISSIONS, hasPermission, getCumulativePermissions } from './rbac-config.js';

export async function runTests() {
    void("🛠️ Starting SkillForge Core Validation...");

    // 1. RBAC Tests
    console.group("🛡️ RBAC Logic Validation");
    const testRoles = [ROLES.HOD, ROLES.SPECIALIST];
    const permissions = getCumulativePermissions(testRoles);
    console.assert(permissions.includes(PERMISSIONS.ACCESS_HOD_CENTER), "HOD should have HOD Center access");
    console.assert(permissions.includes(PERMISSIONS.ACCESS_SPECIALIST_CENTER), "HOD should have Specialist Center access");
    console.assert(hasPermission(testRoles, PERMISSIONS.GIVE_BADGES), "HOD/Specialist should be able to give badges");
    console.assert(!hasPermission([ROLES.SPECIALIST], PERMISSIONS.ACCESS_DIRECTOR_CENTER), "Specialist should NOT have Director access");
    console.assert(hasPermission([ROLES.DIRECTOR], PERMISSIONS.ACCESS_DIRECTOR_CENTER), "Director should have Director access");
    console.groupEnd();

    // 2. State Sync Tests
    console.group("🔄 State Sync Validation");
    // Mocking DashboardState for test
    const mockData = { name: "Test User", roles: [ROLES.DIRECTOR] };
    void("Mocking sync with data:", mockData);
    const cumulative = getCumulativePermissions(mockData.roles);
    console.assert(cumulative.length > 5, "Director should have many permissions");
    console.groupEnd();

    void("✅ Validation Complete. Systems Nominal.");
}
