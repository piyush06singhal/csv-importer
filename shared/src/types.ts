import { CRMStatus, DataSource } from './enums.js';

export interface LeadRecord {
  created_at: string;
  name: string | null;
  email: string | null;
  country_code: string | null;
  mobile_without_country_code: string | null;
  company: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  lead_owner: string | null;
  crm_status: CRMStatus;
  crm_note: string | null;
  data_source: DataSource | null;
  possession_time: string | null;
  description: string | null;
}

export interface SkippedRecord {
  row_index: number;
  raw_data: Record<string, string>;
  reason: string;
}

export interface ImportSummary {
  total_records: number;
  imported_records: number;
  skipped_records: number;
  processing_time_ms: number;
  batch_count: number;
  failed_batches: number;
  retry_count: number;
  avg_batch_time_ms: number;
  rows_per_second: number;
}

export interface ImportResponse {
  success: boolean;
  metadata: ImportSummary;
  records: LeadRecord[];
  skipped: SkippedRecord[];
}
