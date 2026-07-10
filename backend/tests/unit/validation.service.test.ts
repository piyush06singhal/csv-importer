import { ValidationService } from '../../src/services/validation.service.js';
import { CRMStatus, DataSource } from 'shared';

describe('ValidationService Unit Tests', () => {
  let validationService: ValidationService;

  beforeEach(() => {
    validationService = new ValidationService();
  });

  it('should successfully validate a record with only an email', () => {
    const rawRows = [{ email: 'john@test.com', name: 'John' }];
    const mapped = [
      {
        record: {
          email: 'john@test.com',
          name: 'John',
          crm_status: 'GOOD_LEAD_FOLLOW_UP',
        },
        rawIndex: 0,
      },
    ];

    const result = validationService.validateBatch(mapped, rawRows);

    expect(result.records).toHaveLength(1);
    expect(result.skipped).toHaveLength(0);
    expect(result.records[0].email).toBe('john@test.com');
  });

  it('should successfully validate a record with only a mobile number', () => {
    const rawRows = [{ phone: '9876543210', name: 'John' }];
    const mapped = [
      {
        record: {
          mobile_without_country_code: '9876543210',
          name: 'John',
        },
        rawIndex: 0,
      },
    ];

    const result = validationService.validateBatch(mapped, rawRows);

    expect(result.records).toHaveLength(1);
    expect(result.records[0].mobile_without_country_code).toBe('9876543210');
  });

  it('should skip records lacking both email and phone number', () => {
    const rawRows = [{ name: 'Missing Contact Details' }];
    const mapped = [
      {
        record: {
          name: 'Missing Contact Details',
        },
        rawIndex: 0,
      },
    ];

    const result = validationService.validateBatch(mapped, rawRows);

    expect(result.records).toHaveLength(0);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0].row_index).toBe(2); // index 0 maps to spreadsheet row 2
    expect(result.skipped[0].reason).toContain('lacks both email address and mobile number');
  });

  it('should fail schema check and skip record on invalid email structure', () => {
    const rawRows = [{ email: 'invalid-email', name: 'John' }];
    const mapped = [
      {
        record: {
          email: 'invalid-email',
          name: 'John',
        },
        rawIndex: 0,
      },
    ];

    const result = validationService.validateBatch(mapped, rawRows);

    expect(result.records).toHaveLength(0);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0].reason).toContain('Schema validation failed');
  });
});
