import request from 'supertest';
import app from '../src/app.js';

describe('POST /api/import upload validation', () => {
  it('should return 400 Bad Request if no file is uploaded', async () => {
    const res = await request(app).post('/api/import');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
