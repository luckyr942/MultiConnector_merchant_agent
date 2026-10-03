import { describe, it, expect } from 'vitest';
import { maskEmail, maskPhone, maskAddress } from '../src/core/redact.js';

describe('PII Redaction', () => {
  it('masks standard emails', () => {
    expect(maskEmail('rahul.sharma@example.com')).toBe('r**********a@example.com');
    expect(maskEmail('ab@test.com')).toBe('a***@test.com');
    expect(maskEmail(null)).toBe('N/A');
    expect(maskEmail('no-at-sign')).toBe('N/A');
  });

  it('masks phone numbers', () => {
    expect(maskPhone('+919876543210')).toBe('+91******10');
    expect(maskPhone('9876543210')).toBe('987******10');
    expect(maskPhone(null)).toBe('N/A');
    expect(maskPhone('123')).toBe('******');
  });

  it('masks addresses', () => {
    const result = maskAddress('Flat 402 Green Valley');
    expect(result).toContain('****');
    expect(maskAddress(null)).toBe('N/A');
  });
});
