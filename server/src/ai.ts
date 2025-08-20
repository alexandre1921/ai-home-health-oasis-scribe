import fs from 'fs';
import mime from 'mime';

interface OasisValues {
  M1800: string;
  M1810: string;
  M1820: string;
  M1830: string;
  M1840: string;
  M1850: string;
  M1860: string;
}

export async function transcribeAudio(filePath: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const name = filePath.split('/').pop() || 'audio';
    return `Transcribed text for ${name}`;
  }
  try {
    // Whisper API requires multipart/form-data with the audio file.  We read the
    // file into a Buffer and convert it to a Blob so that the fetch API (undici)
    // can handle it properly.  Using fs.createReadStream causes problems with
    // undici's FormData implementation.
    const buffer = fs.readFileSync(filePath);
    const filename = filePath.split('/').pop() || 'audio';
    const mimeType = (mime.lookup(filename) as string) || 'audio/mpeg';
    const blob = new Blob([buffer], { type: mimeType });
    const form = new FormData();
    form.append('file', blob, filename);
    form.append('model', 'whisper-1');
    const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    const data: any = await resp.json();
    if (!resp.ok) throw new Error(data.error?.message || 'Whisper API error');
    return data.text;
  } catch (err) {
    console.warn('Transcription error:', err);
    const name = filePath.split('/').pop() || 'audio';
    return `Transcribed text for ${name}`;
  }
}

export async function summarizeTranscript(transcript: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return transcript.slice(0, 120) + (transcript.length > 120 ? '…' : '');
  }
  try {
    const prompt = `Summarize the following home‑health visit transcript in one sentence.\n\n${transcript}`;
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo-1106',
        messages: [
          { role: 'system', content: 'You summarize clinical conversations.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 50,
      }),
    });
    const data: any = await resp.json();
    if (!resp.ok) throw new Error(data.error?.message || 'Chat API error');
    return data.choices?.[0]?.message?.content?.trim() || '';
  } catch (err) {
    console.warn('Summary error:', err);
    return transcript.slice(0, 120) + (transcript.length > 120 ? '…' : '');
  }
}

export async function extractOasisFields(transcript: string): Promise<{ oasisValues: OasisValues; oasisRaw: any }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const zeros: OasisValues = {
      M1800: '0',
      M1810: '0',
      M1820: '0',
      M1830: '0',
      M1840: '0',
      M1850: '0',
      M1860: '0',
    };
    return { oasisValues: zeros, oasisRaw: zeros };
  }
  try {
    const prompt = `Extract the numeric values for OASIS Section G items M1800, M1810, M1820, M1830, M1840, M1850, M1860 from the transcript below. Respond in JSON with keys for each item.\n\nTranscript:\n${transcript}`;
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo-1106',
        messages: [
          { role: 'system', content: 'You extract OASIS Section G values.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 200,
        response_format: { type: 'json_object' },
      }),
    });
    const data: any = await resp.json();
    if (!resp.ok) throw new Error(data.error?.message || 'Chat API error');
    const content = data.choices?.[0]?.message?.content || '{}';
    const parsed = typeof content === 'string' ? JSON.parse(content) : content;
    const values: OasisValues = {
      M1800: parsed.M1800?.toString() ?? '0',
      M1810: parsed.M1810?.toString() ?? '0',
      M1820: parsed.M1820?.toString() ?? '0',
      M1830: parsed.M1830?.toString() ?? '0',
      M1840: parsed.M1840?.toString() ?? '0',
      M1850: parsed.M1850?.toString() ?? '0',
      M1860: parsed.M1860?.toString() ?? '0',
    };
    return { oasisValues: values, oasisRaw: parsed };
  } catch (err) {
    console.warn('OASIS extraction error:', err);
    const zeros: OasisValues = {
      M1800: '0',
      M1810: '0',
      M1820: '0',
      M1830: '0',
      M1840: '0',
      M1850: '0',
      M1860: '0',
    };
    return { oasisValues: zeros, oasisRaw: zeros };
  }
}