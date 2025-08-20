import express, { Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import basicAuth from 'basic-auth';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { transcribeAudio, extractOasisFields, summarizeTranscript } from './ai';
import { uploadToS3, getSignedUrlForKey } from './s3';
import helmet from 'helmet';
import morgan from 'morgan';

dotenv.config();

const prisma = new PrismaClient();
const app = express();

// Restrict CORS to allowed origins if provided via ALLOWED_ORIGINS (comma‑separated)
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
  : null;
app.use(
  cors({
    origin: allowedOrigins || '*',
  })
);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}
app.use(express.json());

// Authentication middleware (Basic auth)
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const { AUTH_USER, AUTH_PASS } = process.env;
  if (!AUTH_USER || !AUTH_PASS) return next();
  const credentials = basicAuth(req);
  if (!credentials || credentials.name !== AUTH_USER || credentials.pass !== AUTH_PASS) {
    res.set('WWW-Authenticate', 'Basic realm="Lime AI Scribe"');
    return res.status(401).send('Authentication required');
  }
  next();
}
app.use(authMiddleware);

// Multer config: store to temp directory; we'll upload to S3 later
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => cb(null, uploadDir),
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const timestamp = Date.now();
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, `${timestamp}_${sanitized}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (file.mimetype.startsWith('audio/')) cb(null, true);
    else cb(new Error('Invalid file type'));
  },
});

// Utility to handle async route handlers and forward errors
function asyncHandler(fn: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Zod schema for POST /notes
const createNoteSchema = z.object({
  patientId: z.preprocess((v) => Number(v), z.number().int().positive()),
});

// Allowed enumeration values for OASIS Section G items (M1800–M1860).
function normalizeOasisValue(val: any): string {
  const raw = val != null ? String(val).trim() : '';
  if (raw.toUpperCase() === 'NA') return 'NA';
  const num = Number(raw);
  if (Number.isNaN(num)) return '0';
  const clamped = Math.min(6, Math.max(0, Math.trunc(num)));
  return String(clamped);
}

// Routes
app.get('/patients', asyncHandler(async (_req: Request, res: Response) => {
  const patients = await prisma.patient.findMany({ orderBy: { id: 'asc' } });
  res.json(patients);
}));

app.get('/notes', asyncHandler(async (_req: Request, res: Response) => {
  // Return a lightweight listing of notes.  Omit large fields like transcription and oasisRaw
  const notes = await prisma.note.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      createdAt: true,
      summary: true,
      patient: {
        select: { id: true, name: true, dob: true },
      },
    },
  });
  res.json(notes);
}));

const noteIdSchema = z.object({ id: z.preprocess((v) => Number(v), z.number().int().positive()) });
app.get('/notes/:id', asyncHandler(async (req: Request, res: Response) => {
  const parsed = noteIdSchema.safeParse({ id: req.params.id });
  if (!parsed.success) return res.status(400).json({ error: 'Invalid id' });
  const id = parsed.data.id;
  const note = await prisma.note.findUnique({
    where: { id },
    include: { patient: true },
  });
  if (!note) return res.status(404).json({ error: 'Note not found' });
  // Compute audio URL on demand
  let audioUrl: string | null;
  const useS3 = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.S3_BUCKET;
  if (useS3) {
    audioUrl = await getSignedUrlForKey((note as any).audioKey);
  } else {
    audioUrl = `${process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 4000}`}/uploads/${(note as any).audioKey}`;
  }
  res.json({ ...note, audioUrl });
}));

app.post('/notes', upload.single('audio'), asyncHandler(async (req: Request, res: Response) => {
  const parsed = createNoteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid patientId' });
  }
  if (!req.file) return res.status(400).json({ error: 'Audio file is required' });
  const patientId = parsed.data.patientId;
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  const localPath = (req.file as Express.Multer.File).path;
  // AI pipeline: transcribe and analyze before uploading to S3 or deleting local file.
  // This avoids deleting the file prematurely when using S3 storage.
  const transcript = await transcribeAudio(localPath);
  const summary = await summarizeTranscript(transcript);
  const { oasisValues, oasisRaw } = await extractOasisFields(transcript);
  // After generating derived data, persist the audio.  Use S3 if configured;
  // otherwise store the filename to be served locally.  We store only the key
  // (filename) in the database and generate the URL on demand when retrieving the note.
  let audioKey: string;
  const useS3 = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.S3_BUCKET;
  if (useS3) {
    const buffer = fs.readFileSync(localPath);
    audioKey = await uploadToS3((req.file as Express.Multer.File).filename, buffer, (req.file as Express.Multer.File).mimetype);
    // Remove local file after upload to avoid filling the disk
    fs.unlinkSync(localPath);
  } else {
    // On local storage, the key is just the filename; we'll compute the URL later
    audioKey = (req.file as Express.Multer.File).filename;
  }
  const note = await prisma.note.create({
    data: {
      patientId,
      audioKey,
      transcription: transcript,
      summary,
      oasisM1800: normalizeOasisValue((oasisValues as any).M1800),
      oasisM1810: normalizeOasisValue((oasisValues as any).M1810),
      oasisM1820: normalizeOasisValue((oasisValues as any).M1820),
      oasisM1830: normalizeOasisValue((oasisValues as any).M1830),
      oasisM1840: normalizeOasisValue((oasisValues as any).M1840),
      oasisM1850: normalizeOasisValue((oasisValues as any).M1850),
      oasisM1860: normalizeOasisValue((oasisValues as any).M1860),
      oasisRaw: oasisRaw,
    },
    include: { patient: true },
  });
  // Compute audio URL on demand for the response
  const url = useS3 ? await getSignedUrlForKey(audioKey) : `${process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 4000}`}/uploads/${audioKey}`;
  res.status(201).json({ ...note, audioUrl: url });
}));

// Healthcheck endpoint
app.get('/healthz', asyncHandler(async (_req: Request, res: Response) => {
  try {
    // Simple query to verify DB connectivity
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ status: 'error', error: (err as Error).message });
  }
}));

// Serve static uploads if using local storage
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  // Multer errors (size limits, unexpected file, etc.) return 400
  if (err instanceof (multer as any).MulterError) {
    return res.status(400).json({ error: err.message });
  }
  // Invalid file type from our custom fileFilter should also return 400
  if (err && err.message === 'Invalid file type') {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start server only if not imported by tests
if (require.main === module) {
  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

export default app;