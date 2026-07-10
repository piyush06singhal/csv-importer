import { LeadRecord } from 'shared';

export interface LLMResult {
  records: Partial<LeadRecord>[];
}

export interface LLMProvider {
  /**
   * Maps arbitrary CSV rows to standardized LeadRecord structures.
   * @param rows Array of raw key-value pairs representing rows.
   * @param headers Original CSV column headers.
   */
  mapColumns(
    rows: Record<string, string>[],
    headers: string[]
  ): Promise<LLMResult>;
}
