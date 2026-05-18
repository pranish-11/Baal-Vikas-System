# Axion Montessori Backend

Node.js + Express + MongoDB backend designed to plug into the existing `axion-montessori-prototype (1).html` frontend.

## Features

- Frontend-compatible APIs on port `8011`
- MongoDB schema via Prisma ORM
- Seed data for messages, complaints, students, schools, and activities
- Basic security middleware (`helmet`, rate limiting, CORS)
- Input validation (`zod`) and centralized error handling

## Endpoints

- `GET /health`
- `GET /api/messages`
- `POST /api/messages/:id/chat`
- `GET /api/complaints`
- `PATCH /api/complaints/:id/resolve`
- `GET /api/students`
- `GET /api/schools`
- `GET /api/activities`

## Setup

1. Copy env template:
   - `cp .env.example .env`
2. Install dependencies:
   - `npm install`
3. Generate Prisma client:
   - `npm run prisma:generate`
4. Push Prisma schema to MongoDB:
   - `npm run prisma:push`
5. Seed database:
   - `npm run db:seed`
6. Start server:
   - `npm run dev`

Server will run on `http://127.0.0.1:8011`.
