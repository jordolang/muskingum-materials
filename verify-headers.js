/**
 * Verification script for HTTP security headers configuration
 *
 * This script reads the next.config.ts file and verifies that all required
 * security headers are properly configured.
 */

const fs = require('fs');
const path = require('path');

const requiredHeaders = [
  'Content-Security-Policy',
  'Strict-Transport-Security',
  'X-Frame-Options',
  'X-Content-Type-Options',
  'Referrer-Policy',
  'Permissions-Policy'
];

console.log('🔍 Verifying HTTP Security Headers Configuration\n');

try {
  const configPath = path.join(__dirname, 'next.config.ts');
  const configContent = fs.readFileSync(configPath, 'utf8');

  console.log('✅ next.config.ts found and readable\n');

  let allHeadersPresent = true;
  const foundHeaders = {};

  // Check for each required header
  requiredHeaders.forEach(header => {
    // Look for the header key in the configuration
    const headerRegex = new RegExp(`key:\\s*["'\`]${header}["'\`]`, 'i');
    const found = headerRegex.test(configContent);

    foundHeaders[header] = found;

    if (found) {
      console.log(`✅ ${header}: CONFIGURED`);

      // Extract the value for display
      const valueMatch = configContent.match(
        new RegExp(`key:\\s*["'\`]${header}["'\`]\\s*,\\s*value:\\s*["'\`]([^"'\`]+)["'\`]`, 'i')
      );
      if (valueMatch) {
        console.log(`   Value: ${valueMatch[1].substring(0, 80)}${valueMatch[1].length > 80 ? '...' : ''}`);
      } else {
        // For multi-line values, just indicate it's configured
        console.log(`   (Multi-line configuration detected)`);
      }
    } else {
      console.log(`❌ ${header}: MISSING`);
      allHeadersPresent = false;
    }
    console.log();
  });

  // Summary
  console.log('─'.repeat(60));
  if (allHeadersPresent) {
    console.log('✅ SUCCESS: All required security headers are configured!\n');
    console.log('The following headers will be sent on all responses:');
    requiredHeaders.forEach(h => console.log(`  • ${h}`));
    console.log('\n📝 Note: To verify headers are actually sent at runtime:');
    console.log('   1. Start the dev server: npm run dev');
    console.log('   2. Use curl: curl -I http://localhost:3000');
    console.log('   3. Or use browser DevTools Network tab\n');
    process.exit(0);
  } else {
    console.log('❌ FAILURE: Some required security headers are missing!\n');
    process.exit(1);
  }

} catch (error) {
  console.error('❌ Error reading configuration:', error.message);
  process.exit(1);
}
