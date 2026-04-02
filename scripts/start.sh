#!/bin/bash
# Production startup script for Render
# Ensures database exists and is seeded before starting the server

set -e

echo "=== WholesaleOS Production Startup ==="

# Set DB path to writable location
export DATABASE_URL="file:/tmp/dev.db"

# Push schema to create tables if they don't exist
echo "Running prisma db push..."
npx prisma db push --skip-generate 2>&1 || echo "Warning: db push had issues"

# Seed if no users exist (first deploy)
echo "Checking if seed is needed..."
if ! node -e "
const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const adapter = new PrismaLibSql({ url: 'file:/tmp/dev.db' });
const prisma = new PrismaClient({ adapter });
prisma.user.count().then(c => { if (c > 0) { console.log('DB already seeded (' + c + ' users)'); process.exit(0); } else { console.log('No users found, need seed'); process.exit(1); } }).catch(() => { console.log('Table check failed, need seed'); process.exit(1); });
" 2>/dev/null; then
  echo "Seeding database..."
  npx prisma db seed 2>&1 || echo "Warning: seed had issues"
fi

echo "Starting server on port ${PORT:-3000}..."
node .next/standalone/server.js
