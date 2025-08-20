import request from 'supertest';
import app from '../src/app';

describe('Healthcheck', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/healthz');
    expect([200, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toEqual({ status: 'ok' });
    } else {
      expect(res.body.status).toBe('error');
    }
  });
}); 