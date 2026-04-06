import { query } from './turso';

export async function migrateCommunity() {
  try {
    // 1. Create students table (minimal for community feature)
    await query(`
      CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        course TEXT,
        email TEXT,
        year_level TEXT,
        semester TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Create community_posts table
    await query(`
      CREATE TABLE IF NOT EXISTS community_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        user_name TEXT NOT NULL,
        content TEXT,
        topic TEXT DEFAULT 'General',
        image_url TEXT,
        is_unreviewed INTEGER DEFAULT 0,
        poll_question TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure image_url exists for older tables
    try {
      await query(`ALTER TABLE community_posts ADD COLUMN image_url TEXT;`);
    } catch (e) {
      // Column might already exist
    }

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
    throw error;
  }
}

export async function migrateNotifications() {
  try {
    // Ensure students table exists
    await query(`
      CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        course TEXT,
        email TEXT,
        year_level TEXT,
        semester TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create notifications table
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
    throw error;
  }
}

export async function migrateActivityLogs() {
  try {
    // Ensure students table exists
    await query(`
      CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        course TEXT,
        email TEXT,
        year_level TEXT,
        semester TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create activity_logs table
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

export async function migrateStudentStats() {
  try {
    // Ensure students table exists
    await query(`
      CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        course TEXT,
        email TEXT,
        year_level TEXT,
        semester TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create student_stats table
    await query(`
      CREATE TABLE IF NOT EXISTS student_stats (
        user_id TEXT PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
        level INTEGER DEFAULT 1,
        exp INTEGER DEFAULT 0,
        total_quests INTEGER DEFAULT 0,
        total_score INTEGER DEFAULT 0,
        last_quest_at TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add triggers or indexes if needed
    await query(`CREATE INDEX IF NOT EXISTS idx_stats_exp ON student_stats(exp DESC);`);

  } catch (error) {
    console.error("Migration Error (Student Stats):", error);
    throw error;
  }
}

export async function migrateDailyQuests() {
  try {
    // Create daily_quests table
    await query(`
      CREATE TABLE IF NOT EXISTS daily_quests (
        user_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        quest_date TEXT NOT NULL,
        category TEXT NOT NULL,
        questions TEXT NOT NULL, -- JSON string of questions
        difficulty TEXT DEFAULT 'medium',
        current_index INTEGER DEFAULT 0,
        score INTEGER DEFAULT 0,
        is_completed INTEGER DEFAULT 0,
        stats_updated INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, category)
      );
    `);

    // Ensure difficulty column exists for older tables
    try {
      await query(`ALTER TABLE daily_quests ADD COLUMN difficulty TEXT DEFAULT 'medium';`);
    } catch (e) {
      // Column might already exist
    }

    // Ensure unique constraint for (user_id, category) exists
    try {
      await query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_quests_user_cat_unique ON daily_quests(user_id, category);`);
    } catch (e) {
      // Index might already exist
    }

    // Create index for fast lookups (non-unique version if needed, but the unique one covers it)
    await query(`CREATE INDEX IF NOT EXISTS idx_daily_quests_user_cat ON daily_quests(user_id, category);`);

  } catch (error) {
    console.error("Migration Error (Daily Quests):", error);
    throw error;
  }
}

