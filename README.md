# Axion — Montessori Management System

Monorepo scaffold for the Axion spec (Expo mobile + Express/Prisma backend).

## Structure

- `backend/` — API on port **8011**, Prisma + MongoDB
- `mobile/` — Expo Router app (scaffold in progress)

## Backend setup

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:push
npm run db:seed-users
npm run db:seed
npm run dev
```

Demo users (`seed-users.js`): `admin@axionschool.edu`, `anika.roy@axionschool.edu`, `lena.kim@parent.edu` — password `password123`.

## MongoDB

Local: `mongodb://127.0.0.1:27017/axion_montessori`  
Atlas: use `mongodb+srv://.../axion_montessori?retryWrites=true&w=majority` in `backend/.env`.

## Expo Go (mobile)

```bash
cd mobile
npm install
npm run start
```

- Phone and PC must be on the **same Wi‑Fi**, or use `npm run start:tunnel`.
- Update `mobile/.env` with `EXPO_PUBLIC_API_URL=http://<your-pc-ip>:8011` for API calls from a physical device.
- Expo Go must support **SDK 55** (update the app from the store if the QR scan fails).
