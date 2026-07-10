import { CSVService } from '../../src/services/csv.service.js';

describe('CSVService Unit Tests', () => {
  let csvService: CSVService;

  beforeEach(() => {
    csvService = new CSVService();
  });

  it('should parse a standard comma-separated CSV successfully', async () => {
    const csvContent = Buffer.from(
      'Name,Email,Phone\nJohn Doe,john@test.com,1234567890\nJane Smith,jane@test.com,9876543210'
    );
    const result = await csvService.parseCSV(csvContent);

    expect(result.headers).toEqual(['Name', 'Email', 'Phone']);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toEqual({
      Name: 'John Doe',
      Email: 'john@test.com',
      Phone: '1234567890',
    });
  });

  it('should autodetect and parse a semicolon-separated CSV successfully', async () => {
    const csvContent = Buffer.from(
      'Name;Email;Phone\nJohn Doe;john@test.com;1234567890\nJane Smith;jane@test.com;9876543210'
    );
    const result = await csvService.parseCSV(csvContent);

    expect(result.headers).toEqual(['Name', 'Email', 'Phone']);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[1]).toEqual({
      Name: 'Jane Smith',
      Email: 'jane@test.com',
      Phone: '9876543210',
    });
  });

  it('should trim surrounding whitespace from headers and values', async () => {
    const csvContent = Buffer.from(
      '  Name  , Email , Phone \n  John Doe  ,  john@test.com  ,  1234567890  '
    );
    const result = await csvService.parseCSV(csvContent);

    expect(result.headers).toEqual(['Name', 'Email', 'Phone']);
    expect(result.rows[0]).toEqual({
      Name: 'John Doe',
      Email: 'john@test.com',
      Phone: '1234567890',
    });
  });

  it('should skip completely empty rows', async () => {
    const csvContent = Buffer.from(
      'Name,Email\nJohn Doe,john@test.com\n,\nJane Smith,jane@test.com'
    );
    const result = await csvService.parseCSV(csvContent);

    expect(result.rows).toHaveLength(2);
  });

  it('should throw an error on empty buffers', async () => {
    const emptyBuffer = Buffer.from('');
    await expect(csvService.parseCSV(emptyBuffer)).rejects.toThrow(
      'Uploaded CSV file is empty'
    );
  });
});
