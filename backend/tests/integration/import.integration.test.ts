import request from 'supertest';
import app from '../../src/app.js';
import { OpenAIProvider } from '../../src/providers/openai.provider.js';

function parseNDJSON(text: string): any[] {
  return text
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => JSON.parse(line));
}

describe('POST /api/import Integration Tests', () => {
  let mapColumnsSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mapColumnsSpy = jest.spyOn(OpenAIProvider.prototype, 'mapColumns');
  });

  afterEach(() => {
    mapColumnsSpy.mockRestore();
  });

  it('should successfully import valid CSV leads and return 200 OK with streamed progress', async () => {
    mapColumnsSpy.mockResolvedValue({
      records: [
        {
          name: 'Bruce Wayne',
          email: 'bruce@wayne.com',
          country_code: '1',
          mobile_without_country_code: '5550199',
          crm_status: 'GOOD_LEAD_FOLLOW_UP',
          data_source: 'eden_park',
        },
        {
          name: 'Clark Kent',
          email: 'clark@dailyplanet.com',
          country_code: '1',
          mobile_without_country_code: '5550100',
          crm_status: 'SALE_DONE',
          data_source: 'meridian_tower',
        },
      ],
    });

    const csvContent = Buffer.from(
      'Full Name,Email Address,Phone Number,Source\nBruce Wayne,bruce@wayne.com,+15550199,eden_park\nClark Kent,clark@dailyplanet.com,+15550100,meridian_tower'
    );

    const res = await request(app)
      .post('/api/import')
      .attach('file', csvContent, 'leads.csv');

    expect(res.status).toBe(200);

    const events = parseNDJSON(res.text);
    const resultEvent = events.find((e) => e.type === 'result');

    expect(resultEvent).toBeDefined();
    expect(resultEvent.data.success).toBe(true);
    expect(resultEvent.data.metadata.total_records).toBe(2);
    expect(resultEvent.data.metadata.imported_records).toBe(2);
    expect(resultEvent.data.metadata.skipped_records).toBe(0);
    expect(resultEvent.data.records).toHaveLength(2);
    expect(resultEvent.data.records[0].name).toBe('Bruce Wayne');
  });

  it('should trigger skipped list categorization when leads lack contact information', async () => {
    mapColumnsSpy.mockResolvedValue({
      records: [
        {
          name: 'Missing Contact Details',
          email: null,
          mobile_without_country_code: null,
        },
      ],
    });

    const csvContent = Buffer.from('Full Name\nMissing Contact Details');

    const res = await request(app)
      .post('/api/import')
      .attach('file', csvContent, 'leads.csv');

    expect(res.status).toBe(200);

    const events = parseNDJSON(res.text);
    const resultEvent = events.find((e) => e.type === 'result');

    expect(resultEvent).toBeDefined();
    expect(resultEvent.data.metadata.imported_records).toBe(0);
    expect(resultEvent.data.metadata.skipped_records).toBe(1);
    expect(resultEvent.data.skipped[0].row_index).toBe(2);
    expect(resultEvent.data.skipped[0].reason).toContain(
      'lacks both email address and mobile number'
    );
  });

  it('should successfully run exponential retries and then recover if transient error occurs', async () => {
    mapColumnsSpy
      .mockRejectedValueOnce(new Error('Rate limit exceeded'))
      .mockResolvedValueOnce({
        records: [
          {
            name: 'Recovered Lead',
            email: 'recovered@test.com',
            crm_status: 'GOOD_LEAD_FOLLOW_UP',
          },
        ],
      });

    const csvContent = Buffer.from('Name,Email\nRecovered,recovered@test.com');

    const res = await request(app)
      .post('/api/import')
      .attach('file', csvContent, 'leads.csv');

    expect(res.status).toBe(200);

    const events = parseNDJSON(res.text);
    const resultEvent = events.find((e) => e.type === 'result');

    expect(resultEvent).toBeDefined();
    expect(resultEvent.data.metadata.imported_records).toBe(1);
    expect(resultEvent.data.records[0].name).toBe('Recovered Lead');
    expect(mapColumnsSpy).toHaveBeenCalledTimes(2);
  });

  it('should route records to skipped list when AI call fails permanently after all retries', async () => {
    mapColumnsSpy.mockRejectedValue(new Error('OpenAI Service Down'));

    const csvContent = Buffer.from('Name,Email\nFailed Record,failed@test.com');

    const res = await request(app)
      .post('/api/import')
      .attach('file', csvContent, 'leads.csv');

    expect(res.status).toBe(200);

    const events = parseNDJSON(res.text);
    const resultEvent = events.find((e) => e.type === 'result');

    expect(resultEvent).toBeDefined();
    expect(resultEvent.data.metadata.imported_records).toBe(0);
    expect(resultEvent.data.metadata.skipped_records).toBe(1);
    expect(resultEvent.data.skipped[0].reason).toContain('AI Mapping failed permanently');
  });

  it('should return 400 Bad Request on invalid file formats', async () => {
    const res = await request(app)
      .post('/api/import')
      .attach('file', Buffer.from('dummy binary content'), 'photo.jpg');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toContain('Only CSV files');
  });
});
