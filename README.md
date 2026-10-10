# Project System

Project System is an attendance and reporting application for teams to check in, track participation, and export monthly reports. It uses PostgreSQL so it can run reliably on Vercel.

## Features

- Secure admin and agent sign-in
- Daily check-in and check-out tracking
- Attendance history for each user
- Monthly Excel exports for attendance and salary reports
- Simple project branding and dashboard experience

## Tech stack

- Next.js
- Prisma
- PostgreSQL (Neon recommended for Vercel)
- ExcelJS
- bcryptjs

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a PostgreSQL database (for example, a Neon database connected to your Vercel project), then create your private environment file:
   ```bash
   cp .env.example .env
   ```

   Set `DATABASE_URL` to the pooled PostgreSQL connection string and `POSTGRES_URL_NON_POOLING` to the direct, non-pooled connection string from your database provider. Set a unique `AUTH_SECRET` (at least 32 characters) and unique admin and agent passwords (at least 16 characters). Generate secrets with `openssl rand -base64 48`. Never commit or share `.env`.

3. Apply the schema migrations:
   ```bash
   npx prisma migrate deploy
   ```

4. Create the admin and agent accounts using the credentials from `.env`:
   ```bash
   npm run seed
   ```

5. Run the app:
   ```bash
   npm run dev
   ```

6. Open the app in your browser:
   ```bash
   http://localhost:3000
   ```

## Credentials and security

The seed script requires `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `AGENT_EMAIL`, and `AGENT_PASSWORD`. Seeding an existing account updates its password to the configured value. The application also requires `AUTH_SECRET`; it does not fall back to a known default.

## Deploy to Vercel

1. Connect this GitHub repository to Vercel and add a Neon PostgreSQL database, or connect an existing PostgreSQL database.
2. Vercel's Neon integration provides `DATABASE_URL` for the pooled connection and `POSTGRES_URL_NON_POOLING` for the direct, non-pooled connection. In the Vercel project's **Settings → Environment Variables**, add `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `AGENT_EMAIL`, and `AGENT_PASSWORD`. Add production credentials to the Production environment only; use a separate database and credentials for Preview if needed.
3. Deploy. Vercel runs `vercel-build`, which applies the committed Prisma migrations before building the app.
4. Link the project with the Vercel CLI, then create the accounts in the production database by running:
   ```bash
   vercel env run --environment=production -- npm run seed
   ```
   This uses the production environment variables without copying database credentials into a local file. The seed command is safe to repeat, but updates existing account passwords to the configured values.

Do not use a local SQLite database for a Vercel deployment: its filesystem is not persistent or shared between serverless instances.

## Project naming

The product is branded as Project System across the landing page, login screen, and dashboard experience.
