# Project System

Project System is a small attendance and reporting application for teams to check in, track participation, and export monthly reports.

## Features

- Secure admin and agent sign-in
- Daily check-in and check-out tracking
- Attendance history for each user
- Monthly Excel exports for attendance and salary reports
- Simple project branding and dashboard experience

## Tech stack

- Next.js
- Prisma
- SQLite for local development
- ExcelJS
- bcryptjs

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create your private environment file:
   ```bash
   cp .env.example .env
   ```

   Set a unique `AUTH_SECRET` (at least 32 characters) and unique admin and agent passwords (at least 16 characters) in `.env`. For example, generate secrets with `openssl rand -base64 48`. Never commit or share `.env`.

3. Create the new local database and apply the schema:
   ```bash
   npx prisma db push
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

The SQLite database is created at `prisma/project-system.db` and is excluded from Git. To use an existing database, back it up before changing `DATABASE_URL`.

## Credentials and security

The seed script requires `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `AGENT_EMAIL`, and `AGENT_PASSWORD` in `.env`. Seeding an existing account updates its password to the configured value. The application also requires `AUTH_SECRET`; it does not fall back to a known default.

## Project naming

The product is branded as Project System across the landing page, login screen, and dashboard experience.
