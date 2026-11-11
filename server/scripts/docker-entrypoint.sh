#!/bin/sh
set -e

echo "🚀 Starting Travel Trip Server..."

# Prepare Prisma schema according to DATABASE_URL provider
node scripts/prepare-prisma.js

# Run migrations
if [ -n "$DATABASE_URL" ]; then
  case "$DATABASE_URL" in
    postgres://*|postgresql://*)
      echo "📦 Deploying migrations on PostgreSQL database..."
      npx prisma migrate deploy || npx prisma db push
      ;;
    *)
      echo "📦 Synchronizing database schema..."
      npx prisma db push
      ;;
  esac
fi

# Optional seed if SEED_ON_START=true
if [ "$SEED_ON_START" = "true" ]; then
  echo "🌱 Seeding default accounts..."
  node prisma/seed.js || true
fi

echo "🟢 Launching Node.js application..."
exec node src/server.js
