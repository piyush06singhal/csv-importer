import csv from 'csv-parser';
import { Readable } from 'stream';
import { CSVParsingError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export class CSVService {
  async parseCSV(buffer: Buffer): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
    logger.info('CSVService: Starting parsing of CSV file buffer.');

    if (!buffer || buffer.length === 0) {
      throw new CSVParsingError('Uploaded CSV file is empty.');
    }

    const contentStr = buffer.toString('utf8');
    const firstLine = contentStr.split(/\r?\n/)[0] || '';

    // Autodetect delimiter by counting occurrences on the first line
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const separator = semicolonCount > commaCount ? ';' : ',';
    logger.debug(
      `CSVService: Autodetected separator "${separator}" (commas: ${commaCount}, semicolons: ${semicolonCount})`
    );

    const rows: Record<string, string>[] = [];
    const headers: string[] = [];

    const stream = Readable.from(buffer);

    return new Promise((resolve, reject) => {
      stream
        .pipe(
          csv({
            separator,
            mapHeaders: ({ header }) => {
              const cleanedHeader = header.trim();
              if (cleanedHeader && !headers.includes(cleanedHeader)) {
                headers.push(cleanedHeader);
              }
              return cleanedHeader;
            },
            mapValues: ({ value }) => value.trim(),
          })
        )
        .on('data', (data) => {
          const cleanedRow: Record<string, string> = {};
          let hasContent = false;

          for (const key of Object.keys(data)) {
            const trimmedKey = key.trim();
            if (trimmedKey !== '') {
              const val = data[key];
              cleanedRow[trimmedKey] = val;
              if (val !== '') {
                hasContent = true;
              }
            }
          }

          if (hasContent) {
            rows.push(cleanedRow);
          }
        })
        .on('end', () => {
          logger.info(`CSVService: Successfully parsed CSV stream. Extracted ${rows.length} rows.`);

          if (headers.length === 0) {
            return reject(new CSVParsingError('CSV file has no valid column headers.'));
          }

          resolve({ headers, rows });
        })
        .on('error', (err) => {
          logger.error(`CSVService: Error parsing CSV stream: ${err.message}`);
          reject(new CSVParsingError(`Malformed CSV structure: ${err.message}`));
        });
    });
  }
}
