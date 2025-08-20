# Lime AI Scribe – Full‑stack Interview Project

This repository presents a **professional-grade, full‑stack implementation** of an AI scribe for OASIS Section G assessments.  It uses a modern technology stack aligned with the Lime AI job posting for a senior full‑stack engineer (React/Node/Postgres/AWS):

- **Frontend:** Next.js (React) with TypeScript and Tailwind CSS for a fast, accessible UI.  The app provides pages for uploading audio, listing patient notes and viewing note details, and it uses SWR for data fetching and caching.
- **Backend:** Express/TypeScript with Prisma ORM for Postgres, `@aws-sdk/client-s3` for object storage, and `zod` for runtime validation.  The backend exposes a REST API to create and retrieve notes and patients, integrates with OpenAI for transcription and OASIS extraction when an API key is provided, and implements robust error handling and authentication.
- **Database:** PostgreSQL with Prisma migrations and a schema that stores both the raw LLM output and normalised Section G values (M1800–M1860).
- **Deployment:** Docker Compose brings up the database, backend and frontend services.  Secrets are loaded via environment variables.  Audio files are uploaded to S3 with private ACL and delivered via pre‑signed URLs when AWS credentials are provided.  If no S3 credentials are supplied, files are stored on disk and served via the `PUBLIC_BASE_URL`.

This project goes beyond a basic vertical slice by following best practices: clear separation of concerns, strong typing, modular architecture, input validation, sanitized output to prevent XSS, optional HTTP basic authentication, and ready‑to‑use Docker setups.  It is intentionally aligned with your experience (React/Next.js, Node/TypeScript, Prisma/Postgres, AWS/S3).

## Repository structure

```text
lime_ai_project/
│
├── server/          # Express/TypeScript backend with Prisma and S3 integration
│   ├── src/
│   │   ├── app.ts   # Express app and API routes
│   │   ├── ai.ts    # OpenAI integration and fallbacks
│   │   ├── models.ts# Prisma generated types (via @prisma/client)
│   │   ├── s3.ts    # Utility for uploading to S3
│   │   ├── schema.ts# Zod schemas for request validation
│   │   └── ...
│   ├── prisma/
│   │   ├── schema.prisma # Database schema
│   │   └── seed.ts       # Seeds patients on first run
│   ├── Dockerfile        # Backend container image
│   ├── package.json      # Backend dependencies/scripts
│   └── tsconfig.json
│
├── client/          # Next.js frontend
│   ├── pages/
│   │   ├── index.tsx      # Upload page
│   │   ├── notes.tsx      # Notes list
│   │   └── notes/[id].tsx # Note detail
│   ├── components/        # Reusable UI components
│   ├── styles/            # Tailwind configuration
│   ├── next.config.js
│   ├── Dockerfile         # Frontend container
│   ├── package.json       # Frontend dependencies/scripts
│   └── tsconfig.json
│
├── docker-compose.yml  # Brings up database, backend and frontend together
└── .env.example        # Template for environment variables
```

## Quick start

1. **Copy `.env.example` to `.env`** and fill in the values for your environment (Postgres connection, `PUBLIC_BASE_URL`, OpenAI key, AWS credentials, `S3_BUCKET`, auth credentials, etc.).  The `PUBLIC_BASE_URL` should reflect where your backend is reachable (e.g. `http://localhost:4000` in development).

2. **Run the stack with Docker Compose**:

```bash
docker compose up --build
```

The frontend will be available at http://localhost:3000 and the backend at http://localhost:4000.

3. **Development**: You can run the frontend and backend independently via `npm run dev` in their respective folders; Hot‑reloading is configured for both Next.js and the backend.

## Next steps

* Add automated tests with Jest and React Testing Library.
* Implement role‑based access control (e.g. JWT) for fine‑grained security.
* Extend the OASIS integration to other sections beyond Section G.
* Improve the OpenAI extraction prompt by using JSON mode for guaranteed parseable output.

This project is ready for you to iterate upon and extend during the interview process.