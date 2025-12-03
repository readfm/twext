// Simple test suite for db.js searchText function
const { searchText } = require('./db');

console.log('Running tests for searchText function...\n');

let passedTests = 0;
let totalTests = 0;

function test(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✓ ${description}`);
    passedTests++;
  } catch (error) {
    console.log(`✗ ${description}`);
    console.log(`  Error: ${error.message}`);
  }
}

function assertEquals(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\n  Expected: ${JSON.stringify(expected)}\n  Actual: ${JSON.stringify(actual)}`);
  }
}

// Test 1: Search without limit returns all results
test('Search without limit returns all matching results', () => {
  const results = searchText('JavaScript');
  assertEquals(results.length, 4, 'Should return 4 results');
});

// Test 2: Search with limit returns limited results
test('Search with limit 2 returns only 2 results', () => {
  const results = searchText('JavaScript', 2);
  assertEquals(results.length, 2, 'Should return only 2 results');
});

// Test 3: Search with limit 1 returns only 1 result
test('Search with limit 1 returns only 1 result', () => {
  const results = searchText('is', 1);
  assertEquals(results.length, 1, 'Should return only 1 result');
});

// Test 4: Search with limit 5 when fewer matches exist
test('Search with limit 5 returns all results when fewer than 5 matches', () => {
  const results = searchText('the', 5);
  assertEquals(results.length, 3, 'Should return only 3 results (all matches)');
});

// Test 5: Search with no matches returns empty array
test('Search with no matches returns empty array', () => {
  const results = searchText('nonexistent', 5);
  assertEquals(results.length, 0, 'Should return empty array');
});

// Test 6: Search without limit and no matches
test('Search without limit and no matches returns empty array', () => {
  const results = searchText('xyz123');
  assertEquals(results.length, 0, 'Should return empty array');
});

// Test 7: Search is case-insensitive
test('Search is case-insensitive', () => {
  const results1 = searchText('javascript');
  const results2 = searchText('JavaScript');
  const results3 = searchText('JAVASCRIPT');
  assertEquals(results1.length, results2.length, 'Should return same number of results');
  assertEquals(results2.length, results3.length, 'Should return same number of results');
});

// Test 8: Limit of 0 returns empty array
test('Search with limit 0 returns empty array', () => {
  const results = searchText('JavaScript', 0);
  assertEquals(results.length, 0, 'Should return empty array');
});

// Test 9: Negative limit is ignored (returns all results)
test('Search with negative limit is ignored', () => {
  const results = searchText('JavaScript', -1);
  assertEquals(results.length, 4, 'Should return all results');
});

// Test 10: Undefined limit returns all results
test('Search with undefined limit returns all results', () => {
  const results = searchText('JavaScript', undefined);
  assertEquals(results.length, 4, 'Should return all results');
});

// Test 11: Null limit returns all results
test('Search with null limit returns all results', () => {
  const results = searchText('JavaScript', null);
  assertEquals(results.length, 4, 'Should return all results');
});

console.log(`\n${passedTests}/${totalTests} tests passed`);
process.exit(passedTests === totalTests ? 0 : 1);
