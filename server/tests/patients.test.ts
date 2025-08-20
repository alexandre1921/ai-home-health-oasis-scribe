import request from 'supertest';
import app from '../src/app';

describe('Patients API', () => {
  it('returns seeded patients', async () => {
    const res = await request(app).get('/patients');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    expect(res.body[0]).toHaveProperty('name');
    expect(res.body[0]).toHaveProperty('dob');
  });
}); 