import request from 'supertest';
import app from '../src/app';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

jest.mock('../src/ai', () => {
  return {
    transcribeAudio: async () => 'Mock transcript from test',
    summarizeTranscript: async () => 'Mock summary',
    extractOasisFields: async () => ({
      oasisValues: {
        M1800: ' 7 ', // will be clamped to 6
        M1810: 'NA',
        M1820: '3.9', // -> 3
        M1830: '-1', // -> 0
        M1840: 'foo', // -> 0
        M1850: '2',
        M1860: ' 4 ',
      },
      oasisRaw: { any: 'thing' },
    }),
  };
});

const prisma = new PrismaClient();

describe('Notes API', () => {
  let patientId: number;
  let audioFilePath: string;

  beforeAll(async () => {
    const p = await prisma.patient.findFirst();
    if (!p) throw new Error('Seeded patients not found');
    patientId = p.id;

    const tmpDir = path.join(__dirname, 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    audioFilePath = path.join(tmpDir, 'test.mp3');
    fs.writeFileSync(audioFilePath, Buffer.from('ID3'));
  });

  afterAll(async () => {
    try { fs.unlinkSync(audioFilePath); } catch {}
    await prisma.note.deleteMany({});
    await prisma.$disconnect();
  });

  it('rejects when no file is provided', async () => {
    const res = await request(app)
      .post('/notes')
      .field('patientId', String(patientId));
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Audio file is required/);
  });

  it('rejects invalid patientId (non-numeric)', async () => {
    const res = await request(app)
      .post('/notes')
      .field('patientId', 'abc')
      .attach('audio', fs.readFileSync(audioFilePath), { filename: 'test.mp3', contentType: 'audio/mpeg' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid patientId/);
  });

  it('returns 404 for non-existent patient', async () => {
    const res = await request(app)
      .post('/notes')
      .field('patientId', '999999')
      .attach('audio', fs.readFileSync(audioFilePath), { filename: 'test.mp3', contentType: 'audio/mpeg' });
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Patient not found/);
  });

  it('creates a note and normalizes OASIS values', async () => {
    const res = await request(app)
      .post('/notes')
      .field('patientId', String(patientId))
      .attach('audio', fs.readFileSync(audioFilePath), { filename: 'test.mp3', contentType: 'audio/mpeg' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(typeof res.body.audioUrl).toBe('string');
    // Normalized expectations
    expect(res.body.oasisM1800).toBe('6');
    expect(res.body.oasisM1810).toBe('NA');
    expect(res.body.oasisM1820).toBe('3');
    expect(res.body.oasisM1830).toBe('0');
    expect(res.body.oasisM1840).toBe('0');
    expect(res.body.oasisM1850).toBe('2');
    expect(res.body.oasisM1860).toBe('4');
  });

  it('lists notes lightweight', async () => {
    const res = await request(app).get('/notes');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      const note = res.body[0];
      expect(note.transcription).toBeUndefined();
      expect(note.patient).toBeDefined();
    }
  });

  it('gets note by id and validates id param', async () => {
    const created = await request(app)
      .post('/notes')
      .field('patientId', String(patientId))
      .attach('audio', fs.readFileSync(audioFilePath), { filename: 'test.mp3', contentType: 'audio/mpeg' });
    const id = created.body.id;

    const ok = await request(app).get(`/notes/${id}`);
    expect(ok.status).toBe(200);
    expect(ok.body.id).toBe(id);
    expect(typeof ok.body.audioUrl).toBe('string');

    const bad = await request(app).get('/notes/abc');
    expect(bad.status).toBe(400);

    const missing = await request(app).get('/notes/999999');
    expect(missing.status).toBe(404);
  });
}); 