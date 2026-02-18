import { query } from './pg';

export async function migrateCommunity() {
  console.log('Starting Community migration...');

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
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Create community_posts table
    await query(`
      CREATE TABLE IF NOT EXISTS community_posts (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        user_name TEXT NOT NULL,
        content TEXT,
        topic TEXT DEFAULT 'General',
        is_unreviewed BOOLEAN DEFAULT FALSE,
        poll_question TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Create community_comments table
    await query(`
      CREATE TABLE IF NOT EXISTS community_comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        user_name TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
        id SERIAL PRIMARY KEY,
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

    console.log('Community migration completed successfully.');
  } catch (error) {
    console.error('Community migration failed:', error);
    throw error;
  }
}
