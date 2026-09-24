# Backend Enanos: Express + TypeScript + Prisma (SQLite)

## Cómo correrlo
```bash
npm install
cp .env.example .env
npm run db:init
npx prisma generate
npm run dev
```
Probar: http://localhost:3000/api/health → `{ "ok": true }`

## Endpoints
- GET    /api/personas
- POST   /api/personas       (firstName, lastName, age, arrivalDate, isWorking)
- PATCH  /api/personas/:id
- DELETE /api/personas/:id
