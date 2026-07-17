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
        updated_at TEXT
      );
    `);

    // Ensure columns exist for older tables if any
    const studentCols = ['address', 'mobile', 'enrollment_date', 'available_reports', 'settings', 'badges', 'school_year', 'section'];
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
        consecutive_failures INTEGER DEFAULT 0,
        last_attempt_at TEXT,
        updated_at TEXT,
        refresh_lock_until TEXT
      );
    `);

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

export async function migrateCommunity() {
  try {
    // Ensure students table exists
    await migratePortalTables();

    // 2. Create community_posts table
    await query(`
      CREATE TABLE IF NOT EXISTS community_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        user_name TEXT NOT NULL,
        content TEXT,
        topic TEXT DEFAULT 'General',
        image_url TEXT,
        is_anonymous INTEGER DEFAULT 0,
        is_unreviewed INTEGER DEFAULT 0,
        poll_question TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure image_url exists for older tables
    try {
      await query(`ALTER TABLE community_posts ADD COLUMN image_url TEXT;`);
    } catch (e) {}

    // Ensure is_anonymous exists for older tables
    try {
      await query(`ALTER TABLE community_posts ADD COLUMN is_anonymous INTEGER DEFAULT 0;`);
    } catch (e) {}

    // 3. Create community_comments table
    await query(`
      CREATE TABLE IF NOT EXISTS community_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        user_name TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Create community_post_likes table
    await query(`
      CREATE TABLE IF NOT EXISTS community_post_likes (
        post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        PRIMARY KEY (post_id, user_id)
      );
    `);

    // 5. Create community_poll_options table
    await query(`
      CREATE TABLE IF NOT EXISTS community_poll_options (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
        option_text TEXT NOT NULL
      );
    `);

    // 6. Create community_poll_votes table
    await query(`
      CREATE TABLE IF NOT EXISTS community_poll_votes (
        option_id INTEGER NOT NULL REFERENCES community_poll_options(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        PRIMARY KEY (option_id, user_id)
      );
    `);

  } catch (error) {
    console.error("Migration Error (Community):", error);
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

export async function migrateIncidentReports() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS incident_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task TEXT NOT NULL,
        user_id TEXT,
        error_message TEXT,
        ai_result TEXT, -- JSON string
        raw_html TEXT,
        severity TEXT DEFAULT 'warning', -- 'warning' or 'error'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await query(`CREATE INDEX IF NOT EXISTS idx_incidents_task ON incident_reports(task);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_incidents_created ON incident_reports(created_at DESC);`);
  } catch (error) {
    console.error("Migration Error (Incident Reports):", error);
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
