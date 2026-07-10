import { z } from 'zod';
import { CRMStatus, DataSource } from './enums.js';

export const LeadRecordSchema = z.object({
  created_at: z.string().datetime().default(() => new Date().toISOString()),
  name: z.string().max(255).nullable(),
  email: z.preprocess(
    (val) => (val === '' || val === undefined ? null : val),
    z.string().email().nullable()
  ),
  country_code: z.preprocess(
    (val) => (val === '' || val === undefined ? null : val),
    z
      .string()
      .regex(/^\d{1,4}$/, { message: 'Country code must be 1 to 4 digits' })
      .nullable()
  ),
  mobile_without_country_code: z.preprocess(
    (val) => (val === '' || val === undefined ? null : val),
    z
      .string()
      .regex(/^\d{6,15}$/, { message: 'Mobile number must be 6 to 15 digits' })
      .nullable()
  ),
  company: z.string().max(255).nullable(),
  city: z.string().max(100).nullable(),
  state: z.string().max(100).nullable(),
  country: z.string().max(100).nullable(),
  lead_owner: z.string().max(255).nullable(),
  crm_status: z.nativeEnum(CRMStatus).default(CRMStatus.GOOD_LEAD_FOLLOW_UP),
  crm_note: z.string().max(1000).nullable(),
  data_source: z.nativeEnum(DataSource).nullable(),
  possession_time: z.string().max(255).nullable(),
  description: z.string().max(4000).nullable(),
});

/**
 * Filter rule to ensure a lead has at least one communication channel (email or mobile).
 */
export const hasIdentityField = (lead: z.infer<typeof LeadRecordSchema>): boolean => {
  return !!lead.email || !!lead.mobile_without_country_code;
};
