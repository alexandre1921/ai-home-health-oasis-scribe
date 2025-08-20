import { transcribeAudio, summarizeTranscript, extractOasisFields } from '../src/ai';
import fs from 'fs';
import path from 'path';

describe('AI module fallbacks', () => {
  const tmpDir = path.join(__dirname, 'tmp');
  const audioPath = path.join(tmpDir, 'dummy.mp3');

  beforeAll(() => {
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(audioPath, Buffer.from('ID3')); // minimal bytes
    delete process.env.OPENAI_API_KEY;
  });

  afterAll(() => {
    try { fs.unlinkSync(audioPath); } catch {}
    try { fs.rmdirSync(tmpDir); } catch {}
  });

  it('transcribeAudio returns deterministic fallback without API key', async () => {
    const text = await transcribeAudio(audioPath);
    expect(text).toContain('Transcribed text for dummy.mp3');
  });

  it('summarizeTranscript returns truncated text without API key', async () => {
    const transcript = 'a'.repeat(300);
    const summary = await summarizeTranscript(transcript);
    expect(summary.length).toBeLessThanOrEqual(121); // 120 + ellipsis
  });

  it('extractOasisFields returns zeros without API key', async () => {
    const { oasisValues, oasisRaw } = await extractOasisFields('some transcript');
    expect(oasisValues).toEqual({
      M1800: '0',
      M1810: '0',
      M1820: '0',
      M1830: '0',
      M1840: '0',
      M1850: '0',
      M1860: '0',
    });
    expect(oasisRaw).toEqual(oasisValues);
  });
}); 