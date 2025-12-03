#!/usr/bin/env node

const { searchText } = require('./db');

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: node cli.js <command> [options]');
  console.log('Commands:');
  console.log('  search <term> [--limit <number>]  Search for text matching the term');
  process.exit(1);
}

const command = args[0];

if (command === 'search') {
  // Get the search term (first argument after 'search')
  const searchTerm = args[1];
  
  if (!searchTerm) {
    console.error('Error: Search term is required');
    console.log('Usage: node cli.js search <term> [--limit <number>]');
    process.exit(1);
  }
  
  // Parse the --limit flag
  let limit;
  const limitIndex = args.indexOf('--limit');
  if (limitIndex !== -1 && args[limitIndex + 1]) {
    limit = parseInt(args[limitIndex + 1], 10);
    if (isNaN(limit) || limit < 0) {
      console.error('Error: --limit must be a non-negative number');
      process.exit(1);
    }
  }
  
  // Perform the search
  const results = searchText(searchTerm, limit);
  
  // Display results
  if (results.length === 0) {
    console.log(`No results found for: "${searchTerm}"`);
  } else {
    console.log(`Found ${results.length} result(s) for: "${searchTerm}"`);
    if (limit) {
      console.log(`(limited to ${limit})`);
    }
    console.log('');
    results.forEach(item => {
      console.log(`[${item.id}] ${item.text}`);
    });
  }
} else {
  console.error(`Unknown command: ${command}`);
  console.log('Available commands: search');
  process.exit(1);
}
