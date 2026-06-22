#!/bin/bash
# Push the Prisma schema to Neon and verify the new schema landed.
#
# Resilient to Neon serverless cold starts: the database auto-suspends when
# idle and the first connection can time out while compute wakes. Rather than
# failing the whole task on a transient "Can't reach database server" error,
# we retry the push with backoff. Verification uses a real SQL existence check
# (NOT `require('./lib/prisma')` — that file is TypeScript and cannot be loaded
# by plain node, which previously made this step fail even on a healthy DB).
set -euo pipefail

cd "$(dirname "$0")/.."

MAX_ATTEMPTS="${PUSH_SCHEMA_MAX_ATTEMPTS:-5}"
attempt=1

while true; do
  echo "Pushing Prisma schema to database (attempt ${attempt}/${MAX_ATTEMPTS})..."
  if npm run db:push; then
    break
  fi
  if [ "${attempt}" -ge "${MAX_ATTEMPTS}" ]; then
    echo "✗ db:push failed after ${MAX_ATTEMPTS} attempts." >&2
    echo "  If this is a Neon connectivity issue, confirm the database is awake and that" >&2
    echo "  DATABASE_URL / DIRECT_URL in .env.local are current, then re-run this script." >&2
    exit 1
  fi
  backoff=$((attempt * 3))
  echo "⚠️  Push failed (likely a Neon serverless cold start). Retrying in ${backoff}s..." >&2
  sleep "${backoff}"
  attempt=$((attempt + 1))
done

echo "Verifying schema is applied (DeliveryConfig table exists)..."
npx dotenv -e .env.local -- npx prisma db execute \
  --schema prisma/schema.prisma --stdin <<'SQL'
SELECT 1 FROM "DeliveryConfig" LIMIT 1;
SQL

echo "✓ Schema pushed and verified"
