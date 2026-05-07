import { query } from './lib/turso.ts';

async function test() {
  try {
    const studentId = '20241322';
    console.log(`Searching for student: ${studentId}`);
    
    const student = await query('SELECT * FROM students WHERE id = ?', [studentId]);
    console.log('Student Profile:', JSON.stringify(student.rows, null, 2));

    const grades = await query('SELECT * FROM grades WHERE student_id = ?', [studentId]);
    console.log('Grades found:', grades.rowCount);
    console.log(JSON.stringify(grades.rows, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
