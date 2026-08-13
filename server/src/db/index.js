const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const { initSchema } = require('./schema');

let dbPromise = null;

const getDb = async () => {
  if (!dbPromise) {
    const dataDir = process.env.APP_DATA_DIR || path.join(__dirname, '../data');
    const dbPath = path.join(dataDir, 'database.sqlite');
    
    dbPromise = require('fs').promises.mkdir(dataDir, { recursive: true })
      .then(() => open({
        filename: dbPath,
        driver: sqlite3.Database
      })).then(async (db) => {
        // Enable foreign keys
      await db.run('PRAGMA foreign_keys = ON');
      // Journal mode WAL for better concurrency and non-blocking reads/writes
      // High performance PRAGMAs
    await db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA temp_store = MEMORY;
      PRAGMA mmap_size = 30000000000;
      PRAGMA cache_size = -64000;
    `);
      await initSchema(db);
      return db;
    }).catch(err => {
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
};

module.exports = { getDb };
