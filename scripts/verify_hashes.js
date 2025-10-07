#!/usr/bin/env node

/**
 * Verify SHA256 hashes of core automation scripts
 * Reads .autonomy/security/script_hashes.manifest and validates each file
 */

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const MANIFEST_PATH = path.join(__dirname, '..', '.autonomy', 'security', 'script_hashes.manifest');

function computeSHA256(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function verifyHashes() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(`❌ Manifest not found: ${MANIFEST_PATH}`);
    process.exit(1);
  }

  const manifestContent = fs.readFileSync(MANIFEST_PATH, 'utf8');
  const lines = manifestContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  
  let allValid = true;
  let checked = 0;
  let failed = 0;
  let missing = 0;

  console.log('🔍 Verifying script hashes...\n');

  for (const line of lines) {
    const [expectedHash, filePath] = line.trim().split(/\s+/);
    if (!expectedHash || !filePath) continue;

    const fullPath = path.join(__dirname, '..', filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  MISSING: ${filePath}`);
      missing++;
      allValid = false;
      continue;
    }

    const actualHash = computeSHA256(fullPath);
    checked++;

    if (actualHash === expectedHash) {
      console.log(`✅ OK: ${filePath}`);
    } else {
      console.log(`❌ MISMATCH: ${filePath}`);
      console.log(`   Expected: ${expectedHash}`);
      console.log(`   Actual:   ${actualHash}`);
      failed++;
      allValid = false;
    }
  }

  console.log(`\n📊 Summary: ${checked} checked, ${failed} failed, ${missing} missing`);

  if (!allValid) {
    console.error('\n❌ Hash verification FAILED');
    process.exit(1);
  }

  console.log('\n✅ All hashes verified successfully');
  process.exit(0);
}

if (require.main === module) {
  verifyHashes();
}

module.exports = { verifyHashes, computeSHA256 };
