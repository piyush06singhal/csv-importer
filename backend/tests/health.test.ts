import request from 'supertest';
import app from '../src/app.js';

describe('GET /health', () => {
  it('should return 200 OK and be healthy', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.services.openai_api).toBeDefined();
  });
});
