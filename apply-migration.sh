#!/bin/bash

# SMS Order Notifications - Database Migration Script
# This script applies the database migration and regenerates the Prisma client

set -e

echo "=== Applying SMS Notifications Database Migration ==="
echo ""

# Check if we're in the right directory
if [ ! -f "prisma/schema.prisma" ]; then
  echo "Error: prisma/schema.prisma not found. Please run this script from the project root."
  exit 1
fi

# Check if migration exists
if [ ! -d "prisma/migrations/20260409175644_add_sms_notifications" ]; then
  echo "Error: Migration 20260409175644_add_sms_notifications not found."
  exit 1
fi

echo "Step 1: Applying database migration..."
npx prisma migrate deploy

echo ""
echo "Step 2: Regenerating Prisma client..."
npx prisma generate

echo ""
echo "=== Migration Complete ==="
echo ""
echo "Changes applied:"
echo "  ✓ Added smsOptIn field to Order table"
echo "  ✓ Added smsOptIn field to UserProfile table"
echo "  ✓ Created SmsNotification table with indexes"
echo "  ✓ Regenerated Prisma client with new models"
echo ""
echo "Next steps:"
echo "  - Verify migration: npx prisma studio"
echo "  - Start dev server: npm run dev"
echo "  - Test SMS opt-in during checkout"
echo ""
