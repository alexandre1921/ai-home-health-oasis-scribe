import fs from 'fs';
import path from 'path';

process.env.NODE_ENV = 'test';
process.env.PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'http://localhost:4000';

// Ensure uploads directory exists and is clean
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

beforeAll(() => {
  // Prisma is mocked in tests; no DB push/seed necessary here
});

afterEach(() => {
  // Clean uploads directory between tests
  const files = fs.readdirSync(uploadsDir);
  for (const f of files) {
    try { fs.unlinkSync(path.join(uploadsDir, f)); } catch {}
  }
}); 