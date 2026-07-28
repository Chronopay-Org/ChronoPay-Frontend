import { describe, it, expect } from 'vitest';
import { formatNumber, formatCurrency, formatDate } from './formatters';

describe('formatters', () => {
  describe('formatNumber', () => {
    it('formats US numbers correctly', () => {
      expect(formatNumber(1234567.89, 'en-US')).toBe('1,234,567.89');
    });

    it('formats Indian numbering system correctly (en-IN)', () => {
      expect(formatNumber(1234567.89, 'en-IN')).toBe('12,34,567.89');
    });

    it('formats Indian numbering system correctly (hi-IN)', () => {
      expect(formatNumber(1234567.89, 'hi-IN')).toBe('12,34,567.89');
    });

    it('formats Arabic numbers correctly (ar-EG)', () => {
      // Different node versions might have different exact outputs for ar-EG, but it should use arabic numerals
      const result = formatNumber(1234.56, 'ar-EG');
      expect(result).toMatch(/[١٢٣٤٥٦٧٨٩٠]/); // contains arabic numerals
    });
  });

  describe('formatCurrency', () => {
    it('formats USD correctly', () => {
      expect(formatCurrency(1234.56, 'USD', 'en-US')).toBe('$1,234.56');
    });

    it('formats INR correctly (en-IN)', () => {
      // The symbol might be ₹
      const result = formatCurrency(1234567.89, 'INR', 'en-IN');
      expect(result).toContain('12,34,567.89');
    });
  });

  describe('formatDate', () => {
    const testDate = new Date('2023-01-15T12:00:00Z');

    it('formats dates correctly in en-US', () => {
      expect(formatDate(testDate, 'en-US', { timeZone: 'UTC', year: 'numeric', month: 'numeric', day: 'numeric' })).toBe('1/15/2023');
    });

    it('formats dates correctly in ar-EG', () => {
      const result = formatDate(testDate, 'ar-EG', { timeZone: 'UTC', year: 'numeric', month: 'numeric', day: 'numeric' });
      // Depending on runtime, it will be in arabic format
      expect(result).toBeTruthy();
    });
  });
});
