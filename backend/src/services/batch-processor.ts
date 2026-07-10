import { LLMProvider } from '../providers/llm.provider.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.config.js';
import { LeadRecord, SkippedRecord } from 'shared';

export interface BatchProcessingResult {
  mappedRecords: { record: Partial<LeadRecord>; rawIndex: number }[];
  skippedRecords: SkippedRecord[];
  totalBatches: number;
  successBatches: number;
  failedBatches: number;
  retry_count: number;
}

function isTransientError(error: any): boolean {
  const status = error.status || error.statusCode;
  if (status && [429, 500, 502, 503, 504].includes(status)) {
    return true;
  }
  const msg = String(error.message || '').toLowerCase();
  if (
    msg.includes('rate limit') ||
    msg.includes('timeout') ||
    msg.includes('network') ||
    msg.includes('502') ||
    msg.includes('429') ||
    msg.includes('503') ||
    msg.includes('504') ||
    msg.includes('status code')
  ) {
    return true;
  }
  return false;
}

export class BatchProcessor {
  private batchSize: number;
  private maxRetries: number;
  private baseDelayMs: number;

  constructor(
    batchSize: number = 25,
    maxRetries: number = 3,
    baseDelayMs: number = env.NODE_ENV === 'test' ? 1 : 1500
  ) {
    this.batchSize = batchSize;
    this.maxRetries = maxRetries;
    this.baseDelayMs = baseDelayMs;
  }

  async process(
    rows: Record<string, string>[],
    headers: string[],
    llmProvider: LLMProvider,
    onProgress?: (progress: { stage: string; percent: number }) => void
  ): Promise<BatchProcessingResult> {
    const totalRecords = rows.length;
    const totalBatches = Math.ceil(totalRecords / this.batchSize);

    logger.info(
      `BatchProcessor: Initiating batching. Total records: ${totalRecords}, Batch Size: ${this.batchSize}, Total Batches: ${totalBatches}`
    );

    const mappedRecords: { record: Partial<LeadRecord>; rawIndex: number }[] = [];
    const skippedRecords: SkippedRecord[] = [];

    let successBatches = 0;
    let failedBatches = 0;
    let retryCount = 0;

    for (let i = 0; i < totalBatches; i++) {
      const startIdx = i * this.batchSize;
      const endIdx = Math.min(startIdx + this.batchSize, totalRecords);
      const batchRows = rows.slice(startIdx, endIdx);

      logger.info(
        `BatchProcessor: Processing batch ${i + 1}/${totalBatches} (Rows ${startIdx} to ${endIdx - 1})`
      );

      if (onProgress) {
        onProgress({
          stage: `Processing Batch ${i + 1}/${totalBatches}`,
          percent: Math.round(15 + (i / totalBatches) * 70),
        });
      }

      let attempt = 0;
      let batchSuccess = false;
      let lastError: any = null;

      while (attempt <= this.maxRetries && !batchSuccess) {
        try {
          if (attempt > 0) {
            const delay = this.baseDelayMs * Math.pow(2, attempt);
            logger.warn(
              `BatchProcessor: Retrying batch ${i + 1}, attempt ${attempt}/${this.maxRetries} after ${delay}ms delay...`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
          }

          const result = await llmProvider.mapColumns(batchRows, headers);

          result.records.forEach((rec, localIdx) => {
            const rawIndex = startIdx + localIdx;
            mappedRecords.push({
              record: rec,
              rawIndex,
            });
          });

          batchSuccess = true;
          successBatches++;
          logger.info(`BatchProcessor: Successfully completed batch ${i + 1}/${totalBatches}`);
        } catch (error: any) {
          lastError = error;
          attempt++;
          retryCount++;
          logger.error(
            `BatchProcessor: Attempt ${attempt} failed for batch ${i + 1}: ${error.message}`
          );
          if (!isTransientError(error)) {
            logger.warn(
              `BatchProcessor: Non-transient error detected (${error.message}). Aborting retries for batch ${i + 1}.`
            );
            break;
          }
        }
      }

      if (!batchSuccess) {
        failedBatches++;
        logger.error(
          `BatchProcessor: Batch ${i + 1}/${totalBatches} failed permanently after ${attempt - 1} retries.`
        );

        // Mark all rows in this failed batch as skipped
        batchRows.forEach((row, localIdx) => {
          const absoluteIndex = startIdx + localIdx;
          skippedRecords.push({
            // Excel row representation: row 1 is header, so index 0 is row 2
            row_index: absoluteIndex + 2,
            raw_data: row,
            reason: `AI Mapping failed permanently: ${lastError?.message || 'Unknown LLM Error'}`,
          });
        });
      }
    }

    return {
      mappedRecords,
      skippedRecords,
      totalBatches,
      successBatches,
      failedBatches,
      retry_count: retryCount,
    };
  }
}
