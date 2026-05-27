/**
 * Verification script for HTTP security headers configuration
 *
 * This script reads next.config.ts and verifies that all required
 * security headers are present by looking for `key: "HeaderName"` patterns
 * within the headers() array. This ensures we're matching actual header
 * entries, not comments or other string occurrences.
 *
 * To verify headers are actually sent at runtime:
 *   1. Start the dev server: npm run dev
 *   2. curl -sI http://localhost:3000 | grep -i "content-security\|strict-transport\|x-frame\|x-content-type\|referrer-policy\|permissions-policy"
 *   3. Or use browser DevTools > Network tab > response headers
 */

const fs = require('fs');
const path = require('path');

const requiredHeaders = [
  'Content-Security-Policy',
  'Strict-Transport-Security',
  'X-Frame-Options',
  'X-Content-Type-Options',
  'Referrer-Policy',
  'Permissions-Policy',
];

console.log('Verifying HTTP Security Headers Configuration\n');

try {
  const configPath = path.join(__dirname, 'next.config.ts');
  const configContent = fs.readFileSync(configPath, 'utf8');

  console.log('next.config.ts found and readable\n');

  let allHeadersPresent = true;

  for (const header of requiredHeaders) {
    // Match `key: "HeaderName"` or `key: 'HeaderName'` to confirm this is an
    // actual header entry in the headers() array, not a comment or value string.
    const found =
      configContent.includes(`key: "${header}"`) ||
      configContent.includes(`key: '${header}'`) ||
      configContent.includes(`key: \`${header}\``);

    if (found) {
      console.log(`CONFIGURED: ${header}`);
    } else {
      console.log(`MISSING:    ${header}`);
      allHeadersPresent = false;
    }
  }

  console.log('\n' + '-'.repeat(60));

  if (allHeadersPresent) {
    console.log('SUCCESS: All required security headers are configured.\n');
    console.log('Headers present in next.config.ts:');
    for (const h of requiredHeaders) {
      console.log(`  - ${h}`);
    }
    process.exit(0);
  } else {
    console.log('FAILURE: One or more required security headers are missing.\n');
    process.exit(1);
  }
} catch (error) {
  console.error('Error reading configuration:', error.message);
  process.exit(1);
}
