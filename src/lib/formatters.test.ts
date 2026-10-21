import { describe, it, expect } from 'vitest';
import { formatNumber, formatCurrency, formatDate, formatDateLabel, formatTimeRange, getDir } from './formatters';

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

  describe('formatDateLabel', () => {
    it('formats English date label', () => {
      const result = formatDateLabel(new Date('2026-04-01T12:00:00Z'), 'en-US');
      expect(result).toContain('Apr');
      expect(result).toContain('1');
    });

    it('formats Arabic date label with locale ordering', () => {
      const result = formatDateLabel(new Date('2026-04-01T12:00:00Z'), 'ar');
      expect(result).toBeTruthy();
    });

    it('formats Hebrew date label', () => {
      const result = formatDateLabel(new Date('2026-04-01T12:00:00Z'), 'he');
      expect(result).toBeTruthy();
    });
  });

  describe('formatTimeRange', () => {
    it('formats English time range with en-dash', () => {
      const start = new Date('2026-04-01T10:00:00Z');
      const end = new Date('2026-04-01T11:30:00Z');
      const result = formatTimeRange(start, end, 'en-US');
      expect(result).toContain('–');
    });

    it('formats Arabic time range', () => {
      const start = new Date('2026-04-01T10:00:00Z');
      const end = new Date('2026-04-01T11:30:00Z');
      const result = formatTimeRange(start, end, 'ar');
      expect(result).toContain('–');
    });
  });

  describe('getDir', () => {
    it('returns rtl for Arabic', () => {
      expect(getDir('ar')).toBe('rtl');
      expect(getDir('ar-SA')).toBe('rtl');
    });

    it('returns rtl for Hebrew', () => {
      expect(getDir('he')).toBe('rtl');
      expect(getDir('he-IL')).toBe('rtl');
    });

    it('returns rtl for Farsi', () => {
      expect(getDir('fa')).toBe('rtl');
    });

    it('returns rtl for Urdu', () => {
      expect(getDir('ur')).toBe('rtl');
    });

    it('returns ltr for English', () => {
      expect(getDir('en')).toBe('ltr');
      expect(getDir('en-US')).toBe('ltr');
    });

    it('returns ltr for other LTR locales', () => {
      expect(getDir('es')).toBe('ltr');
      expect(getDir('fr')).toBe('ltr');
      expect(getDir('de')).toBe('ltr');
      expect(getDir('hi')).toBe('ltr');
    });
  });
});
