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
        is_unreviewed INTEGER DEFAULT 0,
        poll_question TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

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
    throw error;
  }
}

export async function migrateKnowledgeBase() {
  try {
    // Create assistant_knowledge table for vector search
    await query(`
      CREATE TABLE IF NOT EXISTS assistant_knowledge (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        metadata TEXT,
        embedding F32_BLOB(768)
      );
    `);
  } catch (error) {
    console.error("Migration Error (Knowledge Base):", error);
    throw error;
  }
}
