import { db } from './db';
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { Student, ScheduleItem, Financials, ProspectusSubject, SubjectGrade } from '@/types';
import { parseStudentName } from './utils';

/**
 * Centralized Data Service
 * Handles all data retrieval and aggregation for the student portal.
 * consistent data structure across API routes.
 */

export interface AggregatedStudentData extends Student {
  allGrades?: SubjectGrade[];
  gpa?: string;
}

export async function getStudentProfile(userId: string): Promise<Student | null> {
  try {
    const studentDoc = await getDoc(doc(db, 'students', userId));
    if (!studentDoc.exists()) return null;
    const data = studentDoc.data();
    
    return {
      id: userId,
      name: data.name,
      parsedName: parseStudentName(data.name),
      course: data.course,
      email: data.email,
      address: data.address,
      mobile: data.mobile,
      enrollment_date: data.enrollment_date,
      yearLevel: data.year_level,
      semester: data.semester,
      availableReports: data.available_reports,
      updated_at: data.updated_at,
      settings: data.settings,
      badges: data.badges || []
    };
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return null;
  }
}

export async function getAllStudents(): Promise<Student[]> {
  try {
    const querySnap = await getDocs(collection(db, 'students'));
    const students: Student[] = [];
    querySnap.forEach(doc => {
      const data = doc.data();
      students.push({
        id: doc.id,
        name: data.name,
        parsedName: parseStudentName(data.name),
        course: data.course,
        email: data.email,
        address: data.address,
        mobile: data.mobile,
        enrollment_date: data.enrollment_date,
        yearLevel: data.year_level,
        semester: data.semester,
        availableReports: data.available_reports,
        updated_at: data.updated_at,
        settings: data.settings,
        badges: data.badges || []
      });
    });
    return students;
  } catch (error) {
    console.error('Error fetching all students:', error);
    return [];
  }
}

export async function getStudentSchedule(userId: string): Promise<ScheduleItem[]> {
  try {
    const docSnap = await getDoc(doc(db, 'schedules', userId));
    if (docSnap.exists()) {
      return docSnap.data().items || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return [];
  }
}

export async function getStudentFinancials(userId: string): Promise<Financials | null> {
  try {
    const docSnap = await getDoc(doc(db, 'financials', userId));
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        total: data.total,
        balance: data.balance,
        dueToday: data.due_today,
        ...data.details
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching financials:', error);
    return null;
  }
}

export async function getStudentGrades(userId: string): Promise<SubjectGrade[]> {
  try {
    // 1. Get Prospectus for subject titles
    const prospectusSnap = await getDocs(collection(db, 'prospectus_subjects'));
    const prospectus: Record<string, string> = {};
    prospectusSnap.forEach(d => {
      const data = d.data();
      if (data.description) prospectus[d.id] = data.description;
    });

    const allGrades: SubjectGrade[] = [];
    const seenReports = new Set<string>();

    // 2. Fetch by Query (New Format)
    const q = query(collection(db, 'grades'), where('student_id', '==', userId));
    const querySnap = await getDocs(q);
    
    querySnap.forEach(doc => {
      seenReports.add(doc.id);
      const data = doc.data();
      if (data.items) {
        data.items.forEach((item: any) => {
           // Normalize
           const code = item.code || 'N/A';
           const desc = item.description || prospectus[code] || item.subject || 'Unknown Subject';
           allGrades.push({
             code,
             description: desc,
             grade: item.grade || 'N/A',
             remarks: item.remarks || 'N/A'
           });
        });
      }
    });

    // 3. Fetch Direct (Legacy Format)
    if (!seenReports.has(userId)) {
      const directSnap = await getDoc(doc(db, 'grades', userId));
      if (directSnap.exists()) {
         const data = directSnap.data();
         if (data.items) {
            data.items.forEach((item: any) => {
               const code = item.code || 'N/A';
               const desc = item.description || prospectus[code] || item.subject || 'Unknown Subject';
               allGrades.push({
                 code,
                 description: desc,
                 grade: item.grade || 'N/A',
                 remarks: item.remarks || 'N/A'
               });
            });
         }
      }
    }
    
    return allGrades;
  } catch (error) {
    console.error('Error fetching grades:', error);
    return [];
  }
}

export async function getOfferedSubjects(): Promise<ProspectusSubject[]> {
  try {
    const querySnap = await getDocs(collection(db, 'prospectus_subjects'));
    const subjects: ProspectusSubject[] = [];
    querySnap.forEach(doc => {
      const data = doc.data();
      subjects.push({
        code: doc.id,
        description: data.description || '',
        units: data.units || '0',
        preReq: data.pre_req || ''
      });
    });
    // Sort by code for better UX
    return subjects.sort((a, b) => a.code.localeCompare(b.code));
  } catch (error) {
    console.error('Error fetching offered subjects:', error);
    return [];
  }
}

export async function getFullStudentData(userId: string): Promise<AggregatedStudentData | null> {
  const profile = await getStudentProfile(userId);
  if (!profile) return null;

  const [schedule, financials, grades, offeredSubjects] = await Promise.all([
    getStudentSchedule(userId),
    getStudentFinancials(userId),
    getStudentGrades(userId),
    getOfferedSubjects()
  ]);

  // Calculate GPA
  const numericGrades = grades
      .map(g => parseFloat(g.grade))
      .filter(g => !isNaN(g) && g > 0);
  
  const gpa = numericGrades.length > 0 
      ? (numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length).toFixed(2) 
      : 'N/A';

  return {
    ...profile,
    schedule,
    financials: financials || undefined,
    allGrades: grades,
    offeredSubjects,
    gpa
  };
}
