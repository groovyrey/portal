import { sql } from './db';

export async function initDatabase() {
  try {
    // Students table
    await sql`
      CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        course TEXT,
        gender TEXT,
        address TEXT,
        contact TEXT,
        email TEXT,
        year_level TEXT,
        semester TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Schedules table
    await sql`
      CREATE TABLE IF NOT EXISTS schedules (
        id SERIAL PRIMARY KEY,
        student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
        subject TEXT,
        section TEXT,
        units TEXT,
        time TEXT,
        room TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Financials table
    await sql`
      CREATE TABLE IF NOT EXISTS financials (
        student_id TEXT PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
        total TEXT,
        balance TEXT,
        due_today TEXT,
        details JSONB,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Prospectus Subjects (Global cache)
    await sql`
      CREATE TABLE IF NOT EXISTS prospectus_subjects (
        code TEXT PRIMARY KEY,
        description TEXT,
        units TEXT,
        pre_req TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Grades table
    await sql`
      CREATE TABLE IF NOT EXISTS grades (
        id SERIAL PRIMARY KEY,
        student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
        report_name TEXT,
        subject_code TEXT,
        subject_description TEXT,
        grade TEXT,
        remarks TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}
