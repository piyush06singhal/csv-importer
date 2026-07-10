import { CRMStatus, DataSource } from 'shared';
import {
  normalizeEmail,
  normalizePhone,
  normalizeDate,
  normalizeCRMStatus,
  normalizeDataSource,
} from '../../src/utils/normalizers.js';

describe('Normalizers Unit Tests', () => {
  describe('Email Normalizer', () => {
    it('should lowercase and trim emails', () => {
      expect(normalizeEmail(' John.Doe@Example.com ')).toBe('john.doe@example.com');
    });

    it('should return null for empty string or non-string inputs', () => {
      expect(normalizeEmail('')).toBeNull();
      expect(normalizeEmail(null)).toBeNull();
      expect(normalizeEmail(undefined)).toBeNull();
    });
  });

  describe('Phone Normalizer', () => {
    it('should separate Indian country code 91 from 12-digit numbers', () => {
      const res = normalizePhone('+91 98765-43210');
      expect(res.countryCode).toBe('91');
      expect(res.mobileNumber).toBe('9876543210');
    });

    it('should separate US country code 1 from 11-digit numbers', () => {
      const res = normalizePhone('+1 (555) 019-9922');
      expect(res.countryCode).toBe('1');
      expect(res.mobileNumber).toBe('5550199922');
    });

    it('should guess country code based on length when digits are between 11 and 15 digits', () => {
      const res = normalizePhone('447700900077'); // UK number: 44 + 10 digits
      expect(res.countryCode).toBe('44');
      expect(res.mobileNumber).toBe('7700900077');
    });

    it('should assign full sequence to mobileNumber if no prefix matches and length is <= 10', () => {
      const res = normalizePhone('9876543210');
      expect(res.countryCode).toBeNull();
      expect(res.mobileNumber).toBe('9876543210');
    });
  });

  describe('Date Normalizer', () => {
    it('should convert readable date to ISO string', () => {
      const res = normalizeDate('2026-07-10 12:44:00');
      expect(res).not.toBeNull();
      expect(res).toContain('2026-07-10T');
    });

    it('should return null for invalid date formats', () => {
      expect(normalizeDate('invalid-date')).toBeNull();
    });
  });

  describe('CRM Status Normalizer', () => {
    it('should parse direct matches', () => {
      expect(normalizeCRMStatus('GOOD_LEAD_FOLLOW_UP')).toBe(CRMStatus.GOOD_LEAD_FOLLOW_UP);
      expect(normalizeCRMStatus('sale-done')).toBe(CRMStatus.SALE_DONE);
    });

    it('should map semantic keywords', () => {
      expect(normalizeCRMStatus('closed deal')).toBe(CRMStatus.SALE_DONE);
      expect(normalizeCRMStatus('no answer')).toBe(CRMStatus.DID_NOT_CONNECT);
      expect(normalizeCRMStatus('spam lead')).toBe(CRMStatus.BAD_LEAD);
      expect(normalizeCRMStatus('callback tomorrow')).toBe(CRMStatus.GOOD_LEAD_FOLLOW_UP);
    });

    it('should default to GOOD_LEAD_FOLLOW_UP if unmapped', () => {
      expect(normalizeCRMStatus('random-status-string')).toBe(CRMStatus.GOOD_LEAD_FOLLOW_UP);
    });
  });

  describe('Data Source Normalizer', () => {
    it('should parse direct matches', () => {
      expect(normalizeDataSource('eden_park')).toBe(DataSource.EDEN_PARK);
    });

    it('should map semantic keywords', () => {
      expect(normalizeDataSource('meridian tower campaign')).toBe(DataSource.MERIDIAN_TOWER);
      expect(normalizeDataSource('sarjapur plots export')).toBe(DataSource.SARJAPUR_PLOTS);
    });

    it('should return null if unmapped', () => {
      expect(normalizeDataSource('external facebook ads')).toBeNull();
    });
  });
});
