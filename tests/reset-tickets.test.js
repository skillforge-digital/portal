import { describe, it, expect } from 'vitest';
import { buildResetTicketCode, buildResetWhatsappMessage } from '../assets/registry-utils.js';

describe('reset tickets', () => {
  it('buildResetTicketCode returns 6 digits', () => {
    const code = buildResetTicketCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it('buildResetWhatsappMessage includes email + code', () => {
    const msg = buildResetWhatsappMessage({
      email: 'user@example.com',
      ticketCode: '123456',
      accountType: 'trainee'
    });
    expect(msg).toContain('123456');
    expect(msg.toLowerCase()).toContain('user@example.com');
  });
});
