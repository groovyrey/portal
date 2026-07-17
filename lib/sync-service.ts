import * as cheerio from 'cheerio';
import { query } from './turso';
import { ScraperService, ScrapedStudentInfo, ScrapedScheduleItem, ScrapedFinancials } from './scraper-service';

export class SyncService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async syncStudentData(info: ScrapedStudentInfo, reports: any[]) {
    // 1. Check if existing
    const res = await query('SELECT settings, badges FROM students WHERE id = ?', [this.userId]);
    const exists = res.rowCount > 0;
    
    let settings = exists ? res.rows[0].settings : null;
    const badges = exists ? res.rows[0].badges : [];
    
    if (!settings || Object.keys(settings).length === 0) {
        settings = { 
            notifications: true, 
            isPublic: true, 
            showAcademicInfo: true, 
            classReminders: true,
            paymentReminders: true
        };
    }

    const now = new Date().toISOString();
    await query(`
      INSERT INTO students (id, name, course, school_year, email, year_level, semester, available_reports, address, mobile, enrollment_date, settings, badges, section, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        course = excluded.course,
        school_year = excluded.school_year,
        email = excluded.email,
        year_level = excluded.year_level,
        semester = excluded.semester,
        available_reports = excluded.available_reports,
        address = excluded.address,
        mobile = excluded.mobile,
        enrollment_date = excluded.enrollment_date,
        settings = excluded.settings,
        badges = excluded.badges,
        section = excluded.section,
        updated_at = excluded.updated_at
    `, [
      this.userId, 
      info.name || null, 
      info.course || null, 
      info.schoolYear || null,
      info.email || null, 
      info.yearLevel || null, 
      info.semester || null,
      JSON.stringify(reports), 
      info.address || null, 
      info.mobile || null, 
      info.enrollmentDate || null,
      JSON.stringify(settings), 
      JSON.stringify(badges), 
      info.section || null,
      now
    ]);

    return { isNewUser: !exists, settings, badges };
  }

  async grantBadge(badgeId: string) {
    try {
      const res = await query('SELECT badges FROM students WHERE id = ?', [this.userId]);
      if (res.rowCount > 0) {
        const currentBadges = res.rows[0].badges || [];
        if (!currentBadges.includes(badgeId)) {
          const newBadges = [...currentBadges, badgeId];
          await query('UPDATE students SET badges = ? WHERE id = ?', [JSON.stringify(newBadges), this.userId]);
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

    const now = new Date().toISOString();
    
    // Clear existing grades for this specific report to avoid duplicates
    try {
      await query('DELETE FROM grades WHERE student_id = ? AND report_name = ?', [this.userId, reportName]);
    } catch (e) {
      console.warn(`[SyncService] Failed to clear old grades for ${reportName}:`, e);
    }

    for (const item of subjects) {
      // Ensure no undefined values are passed to Turso (LibSQL), as it throws "Unsupported type of value"
      const params = [
        this.userId || null,
        reportName || 'Unknown Report',
        item.subject_code || item.code || 'N/A',
        item.section || item.code || 'N/A',
        item.description || item.subject || 'N/A',
        item.grade !== undefined ? item.grade : '---',
        item.units !== undefined ? item.units : '0',
        item.remarks !== undefined ? item.remarks : 'N/A',
        now
      ];

      await query(`
        INSERT INTO grades (student_id, report_name, subject_code, section, description, grade, units, remarks, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, params);
    }

    // Automatically check for badges whenever grades are synced
    await this.checkAndGrantBadges(subjects);
  }

  async syncFinancials(financials: ScrapedFinancials) {
    const now = new Date().toISOString();
    const details = {
      installments: financials.installments || [],
      assessment: financials.assessment || [],
      dueAccounts: financials.dueAccounts || [],
      payments: financials.payments || [],
      adjustments: financials.adjustments || []
    };

    await query(`
      INSERT INTO financials (student_id, total, balance, due_today, details)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(student_id) DO UPDATE SET
        total = excluded.total,
        balance = excluded.balance,
        due_today = excluded.due_today,
        details = excluded.details
    `, [
      this.userId, 
      financials.total || "₱0.00", 
      financials.balance || "₱0.00", 
      financials.dueToday || "₱0.00",
      JSON.stringify(details)
    ]);
  }

  async syncSchedule(items: ScrapedScheduleItem[]) {
    // We always update, even if empty, to ensure the local cache
    // reflects the portal's current state (e.g. if a student drops a course)
    await query(`
      INSERT INTO schedules (id, student_id, items)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        items = excluded.items
    `, [this.userId, this.userId, JSON.stringify(items || [])]);
  }

  async performFullSync(scraper: ScraperService, dashboard$: cheerio.CheerioAPI, periodCode: string, dashboardUrl: string, rawDashboardHtml?: string) {
    console.log(`[SyncService] Starting full sync for ${this.userId}...`);
    
    const fetchWithFallback = async (name: string, fn: () => Promise<any>) => {
        try {
            return await fn();
        } catch (e: any) {
            console.warn(`[SyncService] Failed to fetch ${name}:`, e.message);
            return { data: "", $: null };
        }
    };

    const [eaf, grades, accounts] = await Promise.all([
      fetchWithFallback('EAF', () => scraper.fetchEAF(periodCode)),
      fetchWithFallback('Grades', () => scraper.fetchGrades(periodCode, dashboardUrl)),
      fetchWithFallback('Accounts', () => scraper.fetchAccounts(periodCode, dashboardUrl)),
    ]);

    const studentInfo = await scraper.parseStudentInfo(dashboard$, eaf.$ || dashboard$, rawDashboardHtml, eaf.data);
    const schedule = await scraper.parseSchedule(eaf.$!, eaf.data);
    const financials = await scraper.parseFinancials(eaf.$!, eaf.data);
    const extraFinancials = accounts.$ ? scraper.parseAccounts(accounts.$) : {};

    const mergedFinancials = {
      ...financials,
      ...extraFinancials
    };

    const reportLinks = grades.$ ? scraper.parseReportCardLinks(grades.$) : [];

    // Database Syncing
    const { isNewUser, settings, badges } = await this.syncStudentData(studentInfo, reportLinks);
    
    await Promise.all([
      this.syncFinancials(mergedFinancials),
      this.syncSchedule(schedule)
    ]);

    return { 
      isNewUser, 
      settings, 
      badges, 
      studentInfo, 
      schedule, 
      mergedFinancials, 
      reportLinks
    };
  }
}
