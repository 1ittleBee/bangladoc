/**
 * BanglaDoc Test Synchronization Utility
 * Usage: node scripts/update-tests.js [--run]
 * 
 * 1. Checks git diff against origin/main or local main
 * 2. Identifies changed source files and maps them to corresponding tests
 * 3. Optionally executes the relevant test runners
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function getDiffFiles() {
  try {
    // Try diff against main branch
    let diff = execSync('git diff --name-only main...HEAD', { encoding: 'utf-8' }).trim();
    if (!diff) {
      // Check unstaged/staged working tree changes
      diff = execSync('git diff --name-only HEAD', { encoding: 'utf-8' }).trim();
    }
    if (!diff) {
      // Check uncommitted changes
      diff = execSync('git status --porcelain', { encoding: 'utf-8' })
        .split('\n')
        .map(line => line.trim().slice(3))
        .filter(Boolean)
        .join('\n');
    }
    return diff.split('\n').map(f => f.trim().replace(/\\/g, '/')).filter(Boolean);
  } catch (err) {
    // Fallback if main is not fetched
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf-8' });
      return status.split('\n').map(line => line.trim().slice(3)).filter(Boolean);
    } catch {
      return [];
    }
  }
}

const TEST_MAPPING = [
  {
    sourceMatch: /js\/converter\.js/,
    tests: ['tests/unit/converter.test.js']
  },
  {
    sourceMatch: /js\/theme\.js/,
    tests: ['tests/unit/theme.test.js', 'tests/e2e/theme-and-dock.spec.js']
  },
  {
    sourceMatch: /js\/autodraft\.js/,
    tests: ['tests/unit/autodraft.test.js', 'tests/e2e/rent-flow.spec.js']
  },
  {
    sourceMatch: /rent-agreement\.html/,
    tests: [
      'tests/integration/document-bindings.test.js',
      'tests/integration/word-export.test.js',
      'tests/e2e/rent-flow.spec.js'
    ]
  },
  {
    sourceMatch: /(?:commercial-rent|police-gd|money-loan|leave-application|vehicle-sale|bayna-agreement)\.html/,
    tests: ['tests/integration/document-bindings.test.js']
  },
  {
    sourceMatch: /index\.html/,
    tests: ['tests/e2e/home-navigation.spec.js']
  },
  {
    sourceMatch: /\.html$/,
    tests: ['scripts/test-e2e.js']
  }
];

function analyze() {
  const changedFiles = getDiffFiles();
  console.log('='.repeat(60));
  console.log('🔍 BanglaDoc Test Synchronization Analysis');
  console.log('='.repeat(60));

  if (changedFiles.length === 0) {
    console.log('ℹ️  No changed source files detected against main or working tree.');
    return;
  }

  console.log(`\n📁 Changed files (${changedFiles.length}):`);
  changedFiles.forEach(f => console.log(`   - ${f}`));

  const matchedTests = new Set();
  const sourceChanges = [];

  for (const file of changedFiles) {
    if (file.startsWith('tests/') || file.startsWith('.github/') || file.startsWith('.agents/')) {
      continue;
    }
    sourceChanges.push(file);
    for (const rule of TEST_MAPPING) {
      if (rule.sourceMatch.test(file)) {
        rule.tests.forEach(t => matchedTests.add(t));
      }
    }
  }

  console.log('\n🎯 Target Test Suites:');
  if (matchedTests.size === 0) {
    console.log('   (No specific mapping rule triggered; run general test suite: npm test)');
    matchedTests.add('tests/unit/*.test.js');
    matchedTests.add('tests/integration/*.test.js');
  } else {
    matchedTests.forEach(t => console.log(`   ✓ ${t}`));
  }

  // Check if test files were also changed
  const testFilesChanged = changedFiles.filter(f => f.startsWith('tests/'));
  console.log(`\n🧪 Test files changed in this branch: ${testFilesChanged.length}`);
  testFilesChanged.forEach(f => console.log(`   + ${f}`));

  if (sourceChanges.length > 0 && testFilesChanged.length === 0) {
    console.log('\n⚠️  WARNING: Source code changed but NO test files were added/updated!');
    console.log('   Please add or update the matching tests listed above.');
  } else if (sourceChanges.length > 0) {
    console.log('\n✅ Good job! Matching test updates detected.');
  }

  const shouldRun = process.argv.includes('--run');
  if (shouldRun) {
    console.log('\n🚀 Executing test suite...');
    try {
      execSync('npm test', { stdio: 'inherit' });
      console.log('\n✅ All unit and integration tests passed successfully!');
    } catch (err) {
      console.error('\n❌ Tests failed. Please fix before pushing.');
      process.exit(1);
    }
  }
}

analyze();
