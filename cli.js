const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { initDb, getDb, importEntries, listAll, searchText, getByUrl, getCount, exportAll } = require('./db');

const argv = yargs(hideBin(process.argv))
  . command(
    'import <file>',
    'Import entries from JSON file',
    (yargs) => {
      return yargs. positional('file', {
        describe: 'Path to JSON file (e.g., twext.json)',
        type: 'string'
      });
    },
    (argv) => handleImport(argv. file)
  )
  . command(
    'list [limit] [offset]',
    'List all entries',
    (yargs) => {
      return yargs
        .positional('limit', { describe: 'Number of entries to show', type: 'number', default: 50 })
        . positional('offset', { describe: 'Offset for pagination', type: 'number', default: 0 });
    },
    (argv) => handleList(argv.limit, argv. offset)
  )
  . command(
    'search <query>',
    'Search entries by text',
    (yargs) => {
      return yargs.positional('query', {
        describe: 'Search text',
        type: 'string'
      });
    },
    (argv) => handleSearch(argv.query)
  )
  .command(
    'get <url>',
    'Get entry by URL code',
    (yargs) => {
      return yargs.positional('url', {
        describe: 'URL code (e.g., vgk)',
        type: 'string'
      });
    },
    (argv) => handleGet(argv.url)
  )
  .command(
    'count',
    'Get total number of entries',
    () => {},
    () => handleCount()
  )
  .command(
    'export <output>',
    'Export all entries to JSON',
    (yargs) => {
      return yargs.positional('output', {
        describe: 'Output file path',
        type: 'string'
      });
    },
    (argv) => handleExport(argv.output)
  )
  .help()
  .alias('help', 'h')
  .argv;

// Command handlers
function handleImport(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      process.exit(1);
    }

    console.log(`📖 Reading ${filePath}...`);
    const rawData = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(rawData);

    // Extract entries from wafaa. dataHistoryAllListBackup
    const entries = [];
    const backup = jsonData?. wafaa?.dataHistoryAllListBackup || {};
    
    console.log(`🔍 Found ${Object.keys(backup).length} entries in JSON`);

    Object.entries(backup).forEach(([id, entry], index) => {
      const timestamp = Math.floor(Date.now() / 1000) - (Object.keys(backup).length - index) * 60; // Rough LIFO order
      entries.push({
        entry_id: id,
        text: entry.text || '',
        url: entry.url || '',
        created_at: timestamp,
        updated_at: Math.floor(Date.now() / 1000)
      });
    });

    console.log(`💾 Initializing database...`);
    const db = initDb();
    
    console.log(`📝 Importing ${entries.length} entries...`);
    const imported = importEntries(db, entries);
    
    console.log(`✅ Successfully imported ${imported} entries to twext.db`);
    db.close();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

function handleList(limit, offset) {
  try {
    const db = getDb();
    const entries = listAll(db, limit, offset);
    
    if (entries.length === 0) {
      console.log('📭 No entries found');
      db.close();
      return;
    }

    console.log(`\n📚 Showing ${entries.length} entries (offset: ${offset}):\n`);
    entries.forEach((entry, i) => {
      console.log(`${i + 1}.  [${entry.url}] ${entry.text. substring(0, 60)}...`);
    });
    console.log('');
    db.close();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process. exit(1);
  }
}

function handleSearch(query) {
  try {
    const db = getDb();
    const results = searchText(db, query);
    
    if (results. length === 0) {
      console.log(`❌ No results found for: "${query}"`);
      db. close();
      return;
    }

    console.log(`\n🔎 Found ${results.length} results for "${query}":\n`);
    results. forEach((entry, i) => {
      console.log(`${i + 1}. [${entry.url}] ${entry.text}`);
      console.log('');
    });
    db.close();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process. exit(1);
  }
}

function handleGet(url) {
  try {
    const db = getDb();
    const entry = getByUrl(db, url);
    
    if (! entry) {
      console.log(`❌ No entry found with URL: ${url}`);
      db.close();
      return;
    }

    console.log(`\n📄 Entry [${entry.url}]:\n${entry.text}\n`);
    db.close();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

function handleCount() {
  try {
    const db = getDb();
    const count = getCount(db);
    console.log(`📊 Total entries in database: ${count}`);
    db.close();
  } catch (error) {
    console. error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

function handleExport(outputPath) {
  try {
    const db = getDb();
    const entries = exportAll(db);
    
    const output = {
      exported_at: new Date().toISOString(),
      total_entries: entries.length,
      entries: entries
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`✅ Exported ${entries.length} entries to ${outputPath}`);
    db.close();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}