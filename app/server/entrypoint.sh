#!/bin/sh
set -e

echo ">>> Pushing schema to database..."
npx prisma db push --skip-generate

echo ">>> Seeding database..."
npm run seed

echo ">>> Starting server..."
exec node dist/main
