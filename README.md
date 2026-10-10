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

2. Push the Prisma schema:
   ```bash
   npx prisma db push
   ```

3. Seed default users:
   ```bash
   npm run seed
   ```

4. Run the app:
   ```bash
   npm run dev
   ```

5. Open the app in your browser:
   ```bash
   http://localhost:3000
   ```

## Default accounts

- Admin: `admin@bardarash.co` / `admin123`
- Agent: `agent@bardarash.co` / `agent123`

## Project naming

The product is branded as Project System across the landing page, login screen, and dashboard experience.
