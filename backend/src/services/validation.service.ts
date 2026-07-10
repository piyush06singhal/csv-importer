import { LeadRecord, SkippedRecord, LeadRecordSchema, hasIdentityField } from 'shared';
import { logger } from '../utils/logger.js';
import {
  normalizeEmail,
  normalizePhone,
  normalizeDate,
  normalizeCRMStatus,
  normalizeDataSource,
} from '../utils/normalizers.js';

export class ValidationService {
  validateBatch(
    mappedRecords: { record: any; rawIndex: number }[],
    rawRows: Record<string, string>[]
  ): { records: LeadRecord[]; skipped: SkippedRecord[] } {
    logger.info(`ValidationService: Validating a batch of ${mappedRecords.length} records.`);

    const records: LeadRecord[] = [];
    const skipped: SkippedRecord[] = [];

    mappedRecords.forEach(({ record, rawIndex }) => {
      const rawRow = rawRows[rawIndex] || {};
      const spreadsheetRowNumber = rawIndex + 2; // spreadsheet row number (index 0 is row 2)

      try {
        // Pre-normalize incoming fields
        const cleanedEmail = normalizeEmail(record.email);

        const rawPhoneInput = record.mobile_without_country_code || '';
        const phoneParts = normalizePhone(
          record.country_code ? `+${record.country_code}${rawPhoneInput}` : rawPhoneInput
        );

        const dateVal = normalizeDate(record.created_at) || new Date().toISOString();
        const statusVal = normalizeCRMStatus(record.crm_status);
        const sourceVal = normalizeDataSource(record.data_source);

        const processedLead = {
          created_at: dateVal,
          name: record.name ? String(record.name).trim() : null,
          email: cleanedEmail,
          country_code: phoneParts.countryCode,
          mobile_without_country_code: phoneParts.mobileNumber,
          company: record.company ? String(record.company).trim() : null,
          city: record.city ? String(record.city).trim() : null,
          state: record.state ? String(record.state).trim() : null,
          country: record.country ? String(record.country).trim() : null,
          lead_owner: record.lead_owner ? String(record.lead_owner).trim() : null,
          crm_status: statusVal,
          crm_note: record.crm_note ? String(record.crm_note).trim() : null,
          data_source: sourceVal,
          possession_time: record.possession_time ? String(record.possession_time).trim() : null,
          description: record.description ? String(record.description).trim() : null,
        };

        // Zod validation check
        const zodParsed = LeadRecordSchema.safeParse(processedLead);

        if (!zodParsed.success) {
          const firstError = zodParsed.error.errors[0];
          const errorMsg = firstError
            ? `${firstError.path.join('.')}: ${firstError.message}`
            : 'Schema validation mismatch';

          skipped.push({
            row_index: spreadsheetRowNumber,
            raw_data: rawRow,
            reason: `Schema validation failed: ${errorMsg}`,
          });
          return;
        }

        const validLead = zodParsed.data as LeadRecord;

        // Identity check: must have email OR phone
        if (!hasIdentityField(validLead)) {
          skipped.push({
            row_index: spreadsheetRowNumber,
            raw_data: rawRow,
            reason: 'Record lacks both email address and mobile number. At least one is required.',
          });
          return;
        }

        records.push(validLead);
      } catch (err: any) {
        logger.error(`ValidationService: Exception processing record index ${rawIndex}: ${err.message}`);
        skipped.push({
          row_index: spreadsheetRowNumber,
          raw_data: rawRow,
          reason: `Internal validation processing error: ${err.message}`,
        });
      }
    });

    logger.info(
      `ValidationService: Validation complete. Success: ${records.length}, Skipped: ${skipped.length}`
    );
    return { records, skipped };
  }
}
