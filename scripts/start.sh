#!/bin/bash
# Production startup script for Render
# Ensures database exists and is seeded before starting the server

set -e

echo "=== WholesaleOS Production Startup ==="

# Restore prisma files that get wiped by disk mount
echo "Restoring prisma files from build backup..."
cp -n .next/standalone/schema.prisma prisma/schema.prisma 2>/dev/null || true
cp -n .next/standalone/seed.ts prisma/seed.ts 2>/dev/null || true

# Push schema to create tables if they don't exist
echo "Running prisma db push..."
npx prisma db push --skip-generate 2>&1 || echo "Warning: db push had issues"

# Seed the database
echo "Seeding database..."
npx prisma db seed 2>&1 || echo "Warning: seed had issues"

echo "Starting server on port ${PORT:-3000}..."
node .next/standalone/server.js
