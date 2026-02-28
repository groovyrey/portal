import * as cheerio from 'cheerio';
import { db } from '@/lib/db';
import { doc, setDoc, getDoc, serverTimestamp, writeBatch, updateDoc, arrayUnion } from 'firebase/firestore';
import { initDatabase } from '@/lib/db-init';
import { ScraperService, ScrapedStudentInfo, ScrapedScheduleItem, ScrapedFinancials, ScrapedSubject } from './scraper-service';

export class SyncService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async syncStudentData(info: ScrapedStudentInfo, reports: any[]) {
    await initDatabase();
    const studentRef = doc(db, 'students', this.userId);
    const existingStudentDoc = await getDoc(studentRef);
    const isNewUser = !existingStudentDoc.exists();
    
    // Explicitly set default settings for new users or if missing
    let settings = existingStudentDoc.exists() ? (existingStudentDoc.data().settings || null) : null;
    const badges = existingStudentDoc.exists() ? (existingStudentDoc.data().badges || []) : [];
    
    if (!settings) {
        settings = { 
            notifications: true, 
            isPublic: true, 
            showAcademicInfo: true, 
            classReminders: true,
            paymentReminders: true
        };
    }

    await setDoc(studentRef, {
      name: info.name,
      course: info.course,
      email: info.email,
      year_level: info.yearLevel,
      semester: info.semester,
      available_reports: reports,
      address: info.address,
      mobile: info.mobile,
      enrollment_date: info.enrollmentDate,
      settings,
      updated_at: serverTimestamp()
    }, { merge: true });

    return { isNewUser, settings, badges };
  }

  async grantBadge(badgeId: string) {
    try {
      const studentRef = doc(db, 'students', this.userId);
      const studentDoc = await getDoc(studentRef);
      
      if (studentDoc.exists()) {
        const currentBadges = studentDoc.data().badges || [];
        if (!currentBadges.includes(badgeId)) {
          await updateDoc(studentRef, {
            badges: arrayUnion(badgeId)
          });
          console.log(`[BadgeSystem] Granted '${badgeId}' badge to ${this.userId}`);
          return true;
        }
      }
    } catch (error) {
      console.error(`[BadgeSystem] Error granting badge ${badgeId}:`, error);
    }
    return false;
  }

  async checkAndGrantBadges(subjects: any[]) {
    // Look for a 1.00 grade
    const hasPerfectGrade = subjects.some(s => {
      const grade = parseFloat(s.grade);
      return !isNaN(grade) && grade === 1.00;
    });

    if (hasPerfectGrade) {
      await this.grantBadge('perfect_grade');
    }
  }

  async syncGrades(reportName: string, subjects: any[], reportSlug?: string) {
    if (!subjects || subjects.length === 0) return;

    let slug = reportSlug || reportName.replace(/[^a-zA-Z0-9]/g, '_');
    const reportId = `${this.userId}_${slug}`;
    const gradeRef = doc(db, 'grades', reportId);
    
    await setDoc(gradeRef, {
      student_id: this.userId,
      report_name: reportName,
      items: subjects,
      updated_at: serverTimestamp()
    });

    // Automatically check for badges whenever grades are synced
    await this.checkAndGrantBadges(subjects);
  }

  async syncFinancials(financials: ScrapedFinancials) {
    const financialRef = doc(db, 'financials', this.userId);
    await setDoc(financialRef, {
      total: financials.total,
      balance: financials.balance,
      due_today: financials.dueToday || "₱0.00",
      details: {
        installments: financials.installments || [],
        assessment: financials.assessment || [],
        dueAccounts: financials.dueAccounts || [],
        payments: financials.payments || [],
        adjustments: financials.adjustments || []
      },
      updated_at: serverTimestamp()
    }, { merge: true });
  }

  async syncSchedule(items: ScrapedScheduleItem[]) {
    if (items && items.length > 0) {
      const schedulesRef = doc(db, 'schedules', this.userId);
      await setDoc(schedulesRef, {
        items,
        updated_at: serverTimestamp()
      });
    }
  }

  async syncProspectusSubjects(subjects: ScrapedSubject[]) {
    if (!subjects || subjects.length === 0) return;

    // Check if we need to sync prospectus (once per 7 days)
    const lastSyncRef = doc(db, 'system_config', 'prospectus_sync_last_at');
    const lastSyncDoc = await getDoc(lastSyncRef);
    const lastSyncAt = lastSyncDoc.exists() ? (lastSyncDoc.data().at?.toDate?.() || new Date(0)) : new Date(0);
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    if (Date.now() - lastSyncAt.getTime() < sevenDaysMs) {
      console.log('[SyncService] Skipping prospectus sync: Last sync was less than 7 days ago.');
      return;
    }

    const batch = writeBatch(db);
    const subjectsToProcess = subjects.slice(0, 450); 
    for (const sub of subjectsToProcess) {
      const subRef = doc(db, 'prospectus_subjects', sub.code);
      batch.set(subRef, {
        description: sub.description,
        units: sub.units,
        pre_req: sub.preReq,
        updated_at: serverTimestamp()
      }, { merge: true });
    }
    
    await batch.commit();
    await setDoc(lastSyncRef, { at: serverTimestamp() });
  }

  async performFullSync(scraper: ScraperService, dashboard$: cheerio.CheerioAPI, periodCode: string, dashboardUrl: string) {
    console.log(`[SyncService] Starting full sync for ${this.userId}...`);
    
    // Parallel Fetch all data from portal
    const { eaf, grades, accounts, subjects: offeredSubsRes } = await scraper.fetchAllData(periodCode, dashboardUrl, dashboard$);

    // Parse all data
    const studentInfo = scraper.parseStudentInfo(dashboard$, eaf.$);
    const schedule = scraper.parseSchedule(eaf.$);
    const financials = scraper.parseFinancials(eaf.$);
    const extraFinancials = scraper.parseAccounts(accounts.$);

    const mergedFinancials = {
      ...financials,
      ...extraFinancials
    };

    const reportLinks = scraper.parseReportCardLinks(grades.$);
    const offeredSubjects = scraper.parseOfferedSubjects(offeredSubsRes.$);

    // Database Syncing
    const { isNewUser, settings, badges } = await this.syncStudentData(studentInfo, reportLinks);
    
    await Promise.all([
      this.syncFinancials(mergedFinancials),
      this.syncSchedule(schedule),
      this.syncProspectusSubjects(offeredSubjects),
      this.syncToRelationalDB(studentInfo)
    ]);

    return { 
      isNewUser, 
      settings, 
      badges, 
      studentInfo, 
      schedule, 
      mergedFinancials, 
      reportLinks, 
      offeredSubjects 
    };
  }

  async syncToRelationalDB(info: ScrapedStudentInfo) {
    try {
      const { query: tursoQuery } = await import('@/lib/turso');
      await tursoQuery(`
        INSERT INTO students (id, name, course, email, year_level, semester, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET
          name = excluded.name,
          course = excluded.course,
          email = excluded.email,
          year_level = excluded.year_level,
          semester = excluded.semester,
          updated_at = CURRENT_TIMESTAMP
      `, [this.userId, info.name, info.course, info.email, info.yearLevel, info.semester]);
    } catch (error) {
      console.error('Turso student sync error:', error);
    }
  }
}
