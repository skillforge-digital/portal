import { describe, it, expect } from 'vitest';
import { PassCodeEngine } from '../assets/pass-code-engine.js';

describe('PassCodeEngine', () => {
  it('should generate a 6-digit string PIN', () => {
    const pin = PassCodeEngine.generate();
    expect(pin).toMatch(/^\d{6}$/);
    expect(typeof pin).toBe('string');
  });

  it('should verify valid 6-digit PINs', () => {
    expect(PassCodeEngine.verify('123456')).toBe(true);
    expect(PassCodeEngine.verify('999999')).toBe(true);
    expect(PassCodeEngine.verify('000000')).toBe(true);
  });

  it('should reject invalid PINs', () => {
    expect(PassCodeEngine.verify('12345')).toBe(false); // too short
    expect(PassCodeEngine.verify('1234567')).toBe(false); // too long
    expect(PassCodeEngine.verify('abc123')).toBe(false); // alpha
    expect(PassCodeEngine.verify('')).toBe(false); // empty
    expect(PassCodeEngine.verify(null)).toBe(false); // null
  });

  it('should produce random results', () => {
    const pin1 = PassCodeEngine.generate();
    const pin2 = PassCodeEngine.generate();
    expect(pin1).not.toBe(pin2);
  });
});