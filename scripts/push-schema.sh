#!/bin/bash
# Script to push Prisma schema to database and verify client
# Run this after ensuring database connectivity

set -e

echo "Pushing Prisma schema to database..."
npm run db:push

echo "Verifying Prisma client can be imported..."
node -e "import('./lib/prisma.js').then(m => { console.log('OK'); process.exit(0); }).catch(e => { console.error(e); process.exit(1); })"

echo "✓ Schema pushed successfully and Prisma client verified"
