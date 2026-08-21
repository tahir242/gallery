const initSchema = async (db) => {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL,
      status TEXT NOT NULL,
      directories_discovered INTEGER DEFAULT 0,
      files_discovered INTEGER DEFAULT 0,
      files_indexed INTEGER DEFAULT 0,
      files_failed INTEGER DEFAULT 0,
      selected_extensions TEXT,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      error_message TEXT
    );

    CREATE TABLE IF NOT EXISTS directories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL UNIQUE,
      parent_path TEXT,
      name TEXT NOT NULL,
      last_scan_id INTEGER,
      last_scanned_at DATETIME,
      FOREIGN KEY(last_scan_id) REFERENCES scans(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL UNIQUE,
      directory_path TEXT NOT NULL,
      name TEXT NOT NULL,
      ext TEXT,
      mime_type TEXT,
      size INTEGER,
      modified_at DATETIME,
      last_scan_id INTEGER,
      last_scanned_at DATETIME,
      is_favorite INTEGER DEFAULT 0,
      FOREIGN KEY(directory_path) REFERENCES directories(path) ON DELETE CASCADE,
      FOREIGN KEY(last_scan_id) REFERENCES scans(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_directories_parent   ON directories(parent_path);
    CREATE INDEX IF NOT EXISTS idx_media_directory       ON media(directory_path);
    CREATE INDEX IF NOT EXISTS idx_media_ext             ON media(ext);
    CREATE INDEX IF NOT EXISTS idx_media_modified        ON media(modified_at);
    CREATE INDEX IF NOT EXISTS idx_media_fav             ON media(is_favorite);
    CREATE INDEX IF NOT EXISTS idx_scans_path_status     ON scans(path, status);
  `);
  
  try {
    await db.exec('ALTER TABLE media ADD COLUMN is_favorite INTEGER DEFAULT 0;');
  } catch (err) {
    // Column already exists, ignore
  }

  try {
    await db.exec('ALTER TABLE scans ADD COLUMN selected_extensions TEXT;');
  } catch (err) {
    // Column already exists, ignore
  }
};

module.exports = { initSchema };
