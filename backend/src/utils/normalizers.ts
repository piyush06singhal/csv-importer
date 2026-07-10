import { CRMStatus, DataSource } from 'shared';

export function normalizeEmail(email: any): string | null {
  if (typeof email !== 'string') return null;
  const cleaned = email.trim().toLowerCase();
  return cleaned === '' ? null : cleaned;
}

export function normalizePhone(phone: any): {
  countryCode: string | null;
  mobileNumber: string | null;
} {
  if (typeof phone !== 'string' && typeof phone !== 'number') {
    return { countryCode: null, mobileNumber: null };
  }

  const digits = String(phone).replace(/\D/g, '');
  if (digits === '') {
    return { countryCode: null, mobileNumber: null };
  }

  // Common country prefixes matching heuristics
  if (digits.startsWith('91') && digits.length === 12) {
    return { countryCode: '91', mobileNumber: digits.slice(2) };
  }
  if (digits.startsWith('1') && digits.length === 11) {
    return { countryCode: '1', mobileNumber: digits.slice(1) };
  }
  if (digits.startsWith('44') && digits.length === 12) {
    return { countryCode: '44', mobileNumber: digits.slice(2) };
  }

  // Deduce country code length for values > 10 digits
  if (digits.length > 10 && digits.length <= 15) {
    const countryCodeLength = digits.length - 10;
    return {
      countryCode: digits.slice(0, countryCodeLength),
      mobileNumber: digits.slice(countryCodeLength),
    };
  }

  return { countryCode: null, mobileNumber: digits };
}

export function normalizeDate(dateVal: any): string | null {
  if (!dateVal) return null;
  const timestamp = Date.parse(String(dateVal));
  if (isNaN(timestamp)) {
    return null;
  }
  return new Date(timestamp).toISOString();
}

export function normalizeCRMStatus(status: any): CRMStatus {
  if (typeof status !== 'string') return CRMStatus.GOOD_LEAD_FOLLOW_UP;

  const cleaned = status.trim().toUpperCase().replace(/[-\s]/g, '_');

  if (Object.values(CRMStatus).includes(cleaned as any)) {
    return cleaned as CRMStatus;
  }

  // Semantic keyword parsing
  if (
    cleaned.includes('FOLLOW') ||
    cleaned.includes('GOOD') ||
    cleaned.includes('HOT') ||
    cleaned.includes('INTEREST')
  ) {
    return CRMStatus.GOOD_LEAD_FOLLOW_UP;
  }
  if (
    cleaned.includes('NOT') ||
    cleaned.includes('CONNECT') ||
    cleaned.includes('BUSY') ||
    cleaned.includes('UNREACH') ||
    cleaned.includes('ANSWER') ||
    cleaned.includes('NO_')
  ) {
    return CRMStatus.DID_NOT_CONNECT;
  }
  if (
    cleaned.includes('BAD') ||
    cleaned.includes('SPAM') ||
    cleaned.includes('JUNK') ||
    cleaned.includes('WRONG')
  ) {
    return CRMStatus.BAD_LEAD;
  }
  if (
    cleaned.includes('DONE') ||
    cleaned.includes('WON') ||
    cleaned.includes('SALE') ||
    cleaned.includes('CONVERT') ||
    cleaned.includes('CLOSED') ||
    cleaned.includes('DEAL')
  ) {
    return CRMStatus.SALE_DONE;
  }

  return CRMStatus.GOOD_LEAD_FOLLOW_UP;
}

export function normalizeDataSource(source: any): DataSource | null {
  if (!source || typeof source !== 'string') return null;

  const cleaned = source.trim().toLowerCase().replace(/[-\s]/g, '_');

  if (Object.values(DataSource).includes(cleaned as any)) {
    return cleaned as DataSource;
  }

  // Semantic match heuristics
  if (cleaned.includes('demand')) return DataSource.LEADS_ON_DEMAND;
  if (cleaned.includes('meridian') || cleaned.includes('tower')) return DataSource.MERIDIAN_TOWER;
  if (cleaned.includes('eden') || cleaned.includes('park')) return DataSource.EDEN_PARK;
  if (cleaned.includes('varah') || cleaned.includes('swamy')) return DataSource.VARAH_SWAMY;
  if (cleaned.includes('sarjapur') || cleaned.includes('plots')) return DataSource.SARJAPUR_PLOTS;

  return null;
}
