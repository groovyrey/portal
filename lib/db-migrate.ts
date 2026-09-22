import { query } from './turso';

export async function migratePortalTables() {
  try {
    // 1. Students table (Full)
    await query(`
      CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        name TEXT,
        course TEXT,
        school_year TEXT,
        email TEXT,
        address TEXT,
        mobile TEXT,
        enrollment_date TEXT,
        year_level INTEGER,
        semester INTEGER,
        available_reports TEXT, -- JSON
        settings TEXT, -- JSON
        badges TEXT, -- JSON
        profile_photo_url TEXT,
        updated_at TEXT
      );
    `);

    // Ensure columns exist for older tables if any
    const studentCols = ['address', 'mobile', 'enrollment_date', 'available_reports', 'settings', 'badges', 'school_year', 'section', 'profile_photo_url'];
    for (const col of studentCols) {
      try {
        await query(`ALTER TABLE students ADD COLUMN ${col} TEXT;`);
      } catch (e) {}
    }

    // 2. Schedules
    await query(`
      CREATE TABLE IF NOT EXISTS schedules (
        id TEXT PRIMARY KEY,
        student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
        items TEXT -- JSON
      );
    `);

    // 3. Financials
    await query(`
      CREATE TABLE IF NOT EXISTS financials (
        student_id TEXT PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
        total REAL,
        balance REAL,
        due_today REAL,
        details TEXT -- JSON
      );
    `);

    // 4. Grades
    await query(`
      CREATE TABLE IF NOT EXISTS grades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
        report_name TEXT,
        subject_code TEXT,
        section TEXT,
        description TEXT,
        grade TEXT,
        units TEXT,
        remarks TEXT,
        updated_at TEXT
      );
    `);

    // Ensure section, subject_code, and report_name exist
    try {
      await query(`ALTER TABLE grades ADD COLUMN section TEXT;`);
    } catch (e) {}
    try {
      await query(`ALTER TABLE grades ADD COLUMN subject_code TEXT;`);
    } catch (e) {}
    try {
      await query(`ALTER TABLE grades ADD COLUMN report_name TEXT;`);
    } catch (e) {}

    // 5. Portal Sessions
    await query(`
      CREATE TABLE IF NOT EXISTS portal_sessions (
        id TEXT PRIMARY KEY,
        encrypted_jar TEXT,
        encrypted_password TEXT,
        consecutive_failures INTEGER DEFAULT 0,
        last_attempt_at TEXT,
        updated_at TEXT,
        refresh_lock_until TEXT
      );
    `);

    // Ensure encrypted_password exists for older tables
    try {
      await query(`ALTER TABLE portal_sessions ADD COLUMN encrypted_password TEXT;`);
    } catch (e) {}

    // Cache of the last known dashboard URL (saves a round trip per scrape)
    try {
      await query(`ALTER TABLE portal_sessions ADD COLUMN dashboard_url TEXT;`);
    } catch (e) {}

    // 6. Ratings
    await query(`
      CREATE TABLE IF NOT EXISTS ratings (
        user_id TEXT PRIMARY KEY,
        rating INTEGER,
        feedback TEXT,
        updated_at TEXT
      );
    `);

    // 7. Metadata
    await query(`
      CREATE TABLE IF NOT EXISTS metadata (
        id TEXT PRIMARY KEY,
        data TEXT -- JSON
      );
    `);

  } catch (error) {
    console.error("Migration Error (Portal Tables):", error);
    throw error;
  }
}

export async function migrateNotifications() {
  try {
    await migratePortalTables();

    await query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        is_read INTEGER DEFAULT 0,
        link TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (error) {
    console.error("Migration Error (Notifications):", error);
    throw error;
  }
}

export async function migrateActivityLogs() {
  try {
    await migratePortalTables();

    await query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        details TEXT,
        link TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (error) {
    console.error("Migration Error (Activity Logs):", error);
    throw error;
  }
}

export async function dropIncidentReports() {
  try {
    // Incidents feature removed; purge the legacy table and its indexes.
    await query(`DROP TABLE IF EXISTS incident_reports;`);
  } catch (error) {
    console.error("Migration Error (Drop Incident Reports):", error);
    throw error;
  }
}

export async function migrateAdminLogs() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        admin_id TEXT,
        admin_name TEXT,
        target_id TEXT,
        target_name TEXT,
        action TEXT,
        details TEXT
      );
    `);
  } catch (error) {
    console.error("Migration Error (Admin Logs):", error);
    throw error;
  }
}

export async function migrateCronRuns() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS cron_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id TEXT,
        status TEXT,
        last_run TEXT,
        tasks TEXT, -- JSON
        results TEXT -- JSON
      );
    `);
  } catch (error) {
    console.error("Migration Error (Cron Runs):", error);
    throw error;
  }
}

export async function migrateDeviceTokens() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS device_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE(user_id, token)
      );
    `);
  } catch (error) {
    console.error("Migration Error (Device Tokens):", error);
    throw error;
  }
}
