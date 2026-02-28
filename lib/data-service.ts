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

// Simple in-memory cache for offered subjects (TTL: 1 hour)
let offeredSubjectsCache: { data: ProspectusSubject[], timestamp: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000;

export async function getStudentGrades(userId: string): Promise<SubjectGrade[]> {
  try {
    // 1. Fetch by Query (New Format)
    const q = query(collection(db, 'grades'), where('student_id', '==', userId));
    const querySnap = await getDocs(q);
    
    // We'll use a map to deduplicate by subject key, keeping the latest one based on updated_at
    const subjectsMap = new Map<string, { grade: SubjectGrade, updatedAt: number }>();

    // Helper to process items
    const processItems = (items: any[], updatedAt: any) => {
        if (!items) return;
        const ts = updatedAt?.toMillis ? updatedAt.toMillis() : (updatedAt instanceof Date ? updatedAt.getTime() : 0);
        
        items.forEach((item: any) => {
           const code = item.code || 'N/A';
           const desc = item.description || item.subject || 'Unknown Subject';
           const key = `${code}-${desc}`.toLowerCase();
           
           const current = subjectsMap.get(key);
           if (!current || ts >= current.updatedAt) {
               subjectsMap.set(key, {
                   grade: {
                       code,
                       description: desc,
                       grade: item.grade || 'N/A',
                       remarks: item.remarks || 'N/A'
                   },
                   updatedAt: ts
               });
           }
        });
    };

    querySnap.forEach(doc => {
      const data = doc.data();
      processItems(data.items, data.updated_at);
    });

    // If no grades found in query, check direct document for legacy compatibility
    if (subjectsMap.size === 0) {
      const directSnap = await getDoc(doc(db, 'grades', userId));
      if (directSnap.exists()) {
         const data = directSnap.data();
         processItems(data.items, data.updated_at);
      }
    }
    
    return Array.from(subjectsMap.values()).map(v => v.grade);
  } catch (error) {
    console.error('Error fetching grades:', error);
    return [];
  }
}

export async function getOfferedSubjects(): Promise<ProspectusSubject[]> {
  // Check cache
  if (offeredSubjectsCache && (Date.now() - offeredSubjectsCache.timestamp < CACHE_TTL)) {
    return offeredSubjectsCache.data;
  }

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
    const sorted = subjects.sort((a, b) => a.code.localeCompare(b.code));
    
    // Update cache
    offeredSubjectsCache = { data: sorted, timestamp: Date.now() };
    
    return sorted;
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

  // Calculate Weighted GPA
  let totalWeightedGrade = 0;
  let totalUnits = 0;

  // Create a map for quick subject lookup to get units
  const subjectUnitsMap = new Map<string, number>();
  offeredSubjects.forEach(s => {
    const units = parseFloat(s.units);
    if (!isNaN(units)) subjectUnitsMap.set(s.code.toLowerCase(), units);
  });

  grades.forEach(g => {
    const grade = parseFloat(g.grade);
    if (!isNaN(grade) && grade > 0) {
      const units = subjectUnitsMap.get(g.code.toLowerCase()) || 3.0; // Default to 3 units if not found
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
    offeredSubjects,
    gpa
  };
}
