import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { LLMProvider } from '../providers/llm.provider.js';
import { CSVService } from '../services/csv.service.js';
import { ValidationService } from '../services/validation.service.js';
import { BatchProcessor } from '../services/batch-processor.js';

export class ImportController {
  constructor(
    private llmProvider: LLMProvider,
    private csvService: CSVService,
    private validationService: ValidationService
  ) {}

  importCSV = async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    logger.info('ImportController: POST /api/import requested.');

    try {
      // 1. Pre-stream validation: File presence check
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'No file uploaded. Please upload a valid CSV file.',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Configure chunked stream response (NDJSON formatting) after pre-stream checks pass
      res.setHeader('Content-Type', 'application/x-ndjson');
      res.setHeader('Transfer-Encoding', 'chunked');

      const sendProgress = (stage: string, percent: number) => {
        res.write(JSON.stringify({ type: 'progress', stage, percent }) + '\n');
      };

      sendProgress('Uploading CSV file...', 5);
      const fileBuffer = req.file.buffer;
      logger.info(
        `ImportController: Ingested file "${req.file.originalname}" (${req.file.size} bytes).`
      );

      sendProgress('Parsing rows...', 10);

      // 2. Parse CSV
      const { headers, rows } = await this.csvService.parseCSV(fileBuffer);
      if (rows.length === 0) {
        throw new ValidationError('Uploaded CSV file contains no data rows.');
      }

      sendProgress('Preparing AI Batches...', 15);

      // 3. Batch processing (default size = 25, retry count = 3)
      const batchProcessor = new BatchProcessor(25, 3);
      const batchResult = await batchProcessor.process(
        rows,
        headers,
        this.llmProvider,
        (progress) => {
          sendProgress(progress.stage, progress.percent);
        }
      );

      sendProgress('Validating AI Output...', 85);

      // 4. Schema validations and normalizations
      const validationResult = this.validationService.validateBatch(
        batchResult.mappedRecords,
        rows
      );

      sendProgress('Normalizing Records...', 92);

      // 5. Consolidate skipped records from both batch failures and Zod validation errors
      const finalSkipped = [
        ...batchResult.skippedRecords,
        ...validationResult.skipped,
      ].sort((a, b) => a.row_index - b.row_index); // Sort logically by original spreadsheet row number

      sendProgress('Generating Results...', 98);

      const durationMs = Date.now() - startTime;
      logger.info(`ImportController: Import processing completed in ${durationMs}ms.`);

      const metadata = {
        total_records: rows.length,
        imported_records: validationResult.records.length,
        skipped_records: finalSkipped.length,
        processing_time_ms: durationMs,
        batch_count: batchResult.totalBatches,
        failed_batches: batchResult.failedBatches,
        retry_count: batchResult.retry_count,
        avg_batch_time_ms: Math.round(durationMs / (batchResult.totalBatches || 1)),
        rows_per_second: Math.round((rows.length / ((durationMs || 1) / 1000)) * 100) / 100,
      };

      // Send the final result payload
      res.write(
        JSON.stringify({
          type: 'result',
          data: {
            success: true,
            metadata,
            records: validationResult.records,
            skipped: finalSkipped,
          },
        }) + '\n'
      );
      res.end();
    } catch (err: any) {
      logger.error(`ImportController: Import execution failed: ${err.message}`);
      const code = err.code || 'API_ERROR';
      // Write error chunk to notify the client stream
      res.write(
        JSON.stringify({
          type: 'error',
          error: {
            code,
            message: err.message || 'An unexpected server error occurred.',
          },
        }) + '\n'
      );
      res.end();
    }
  };
}
