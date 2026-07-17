import { query } from './turso';
import { Student, ScheduleItem, Financials, ProspectusSubject, SubjectGrade } from '@/types';
import { parseStudentName } from './utils';

/**
 * Centralized Data Service (Turso Implementation)
 * Handles all data retrieval and aggregation for the student portal.
 * consistent data structure across API routes.
 */

export interface AggregatedStudentData extends Student {
  allGrades?: SubjectGrade[];
  gpa?: string;
}

export async function getStudentProfile(userId: string): Promise<Student | null> {
  try {
    const res = await query('SELECT * FROM students WHERE id = ?', [userId]);
    if (res.rowCount === 0) return null;
    const data = res.rows[0];
    
    return {
      id: userId,
      name: data.name,
      parsedName: parseStudentName(data.name),
      course: data.course,
      email: data.email,
      address: data.address,
      mobile: data.mobile,
      enrollment_date: data.enrollment_date,
      schoolYear: data.school_year,
      yearLevel: data.year_level,
      semester: data.semester,
      section: data.section || null,
      availableReports: data.available_reports || [],
      updated_at: data.updated_at,
      settings: data.settings || {},
      badges: data.badges || []
    };
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return null;
  }
}

export async function getAllStudents(): Promise<Student[]> {
  try {
    const res = await query('SELECT * FROM students');
    return res.rows.map(data => ({
      id: data.id,
      name: data.name,
      parsedName: parseStudentName(data.name),
      course: data.course,
      email: data.email,
      address: data.address,
      mobile: data.mobile,
      enrollment_date: data.enrollment_date,
      schoolYear: data.school_year,
      yearLevel: data.year_level,
      semester: data.semester,
      section: data.section || null,
      availableReports: data.available_reports || [],
      updated_at: data.updated_at,
      settings: data.settings || {},
      badges: data.badges || []
    }));
  } catch (error) {
    console.error('Error fetching all students:', error);
    return [];
  }
}

export async function getStaffMembers(): Promise<Student[]> {
  try {
    // In SQL, we'll need to handle the 'badges' array. 
    // Since we don't have a separate table for badges yet, and it might be stored as JSON or not migrated correctly yet.
    // Let's check how badges are stored. If they are in the students table as JSON.
    const res = await query("SELECT * FROM students WHERE badges LIKE '%staff%'");
    return res.rows.map(data => ({
      id: data.id,
      name: data.name,
      parsedName: parseStudentName(data.name),
      course: data.course,
      email: data.email,
      address: data.address,
      mobile: data.mobile,
      enrollment_date: data.enrollment_date,
      schoolYear: data.school_year,
      yearLevel: data.year_level,
      semester: data.semester,
      section: data.section || null,
      availableReports: data.available_reports || [],
      updated_at: data.updated_at,
      settings: data.settings || {},
      badges: data.badges || []
    }));
  } catch (error) {
    console.error('Error fetching staff members:', error);
    return [];
  }
}

export async function getStudentSchedule(userId: string): Promise<ScheduleItem[]> {
  try {
    const res = await query('SELECT items FROM schedules WHERE student_id = ?', [userId]);
    if (res.rowCount > 0) {
      return res.rows[0].items || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return [];
  }
}

export async function getStudentFinancials(userId: string): Promise<Financials | null> {
  try {
    const res = await query('SELECT * FROM financials WHERE student_id = ?', [userId]);
    if (res.rowCount > 0) {
      const data = res.rows[0];
      const details = data.details || {};
      return {
        total: data.total,
        balance: data.balance,
        dueToday: data.due_today,
        installments: details.installments || [],
        dueAccounts: details.dueAccounts || [],
        payments: details.payments || [],
        assessment: details.assessment || [],
        adjustments: details.adjustments || []
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching financials:', error);
    return null;
  }
}

export async function getStudentGrades(userId: string, reportName?: string): Promise<SubjectGrade[]> {
  try {
    let sql = 'SELECT * FROM grades WHERE student_id = ?';
    const params: any[] = [userId];

    if (reportName) {
      sql += ' AND report_name = ?';
      params.push(reportName);
    }

    sql += ' ORDER BY updated_at DESC';
    
    const res = await query(sql, params);
    
    // De-duplicate by subject key (description + section + report_name)
    const subjectsMap = new Map<string, SubjectGrade>();

    res.rows.forEach((item: any) => {
      const section = item.section || item.code || 'N/A';
      const subjectCode = item.subject_code || 'N/A';
      const desc = item.description || 'Unknown Subject';
      const report = item.report_name || 'Unknown';
      
      // If reportName is provided, we only care about uniqueness within that report
      // If not, we want all grades across all reports, but unique within their respective reports
      const key = `${report}-${section}-${desc}`.toLowerCase();
      
      if (!subjectsMap.has(key)) {
        subjectsMap.set(key, {
          code: subjectCode,
          section: section,
          description: desc,
          grade: item.grade || 'N/A',
          units: item.units || '3.0',
          remarks: item.remarks || 'N/A'
        });
      }
    });
    
    return Array.from(subjectsMap.values());
  } catch (error) {
    console.error('Error fetching grades:', error);
    return [];
  }
}

export async function getOfferedSubjects(): Promise<ProspectusSubject[]> {
  try {
    const res = await query('SELECT * FROM prospectus_subjects ORDER BY code ASC');
    return res.rows.map(data => ({
      code: data.code,
      description: data.description || '',
      units: data.units || '0',
      preReq: data.pre_req || ''
    }));
  } catch (error) {
    console.error('Error fetching offered subjects:', error);
    return [];
  }
}

export async function getFullStudentData(userId: string): Promise<AggregatedStudentData | null> {
  const profile = await getStudentProfile(userId);
  if (!profile) return null;

  const [schedule, financials, grades] = await Promise.all([
    getStudentSchedule(userId),
    getStudentFinancials(userId),
    getStudentGrades(userId)
  ]);

  // Calculate Weighted GPA
  let totalWeightedGrade = 0;
  let totalUnits = 0;

  grades.forEach(g => {
    const grade = parseFloat(g.grade);
    if (!isNaN(grade) && grade > 0) {
      const units = g.units ? parseFloat(g.units) : 3.0;
      totalWeightedGrade += grade * units;
      totalUnits += units;
    }
  });

  const gpa = totalUnits > 0 ? (totalWeightedGrade / totalUnits).toFixed(2) : 'N/A';

  return {
    ...profile,
    schedule,
    financials: financials || undefined,
    allGrades: grades,
    offeredSubjects: [],
    gpa
  };
}
