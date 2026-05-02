import { describe, it, expect } from 'vitest';
import { getAllStaffDashboardPaths } from '../assets/staff-identity.js';

describe('staff role gateway', () => {
  it('maps multiple roles to multiple dashboards', () => {
    const out = getAllStaffDashboardPaths({ roles: ['Director', 'Specialist'] });
    const paths = out.map((x) => x.path);
    expect(paths).toContain('/staffs/director/');
    expect(paths).toContain('/staffs/specialist/');
  });
});

