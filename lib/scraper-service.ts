import * as cheerio from 'cheerio';
import { AxiosInstance } from 'axios';

export interface ScrapedStudentInfo {
  name: string;
  course: string;
  email: string;
  yearLevel: string;
  semester: string;
  address: string;
  mobile: string;
  enrollmentDate: string;
  periodCode: string;
  dashboardUrl: string;
}

export interface ScrapedScheduleItem {
  subject: string;
  description: string;
  section: string;
  units: string;
  time: string;
  room: string;
}

export interface ScrapedFinancials {
  total: string;
  balance: string;
  installments: any[];
  assessment: any[];
}

export interface ScrapedSubject {
  code: string;
  description: string;
  units: string;
  preReq: string;
}

export class ScraperService {
  private client: AxiosInstance;
  private userId: string;

  constructor(client: AxiosInstance, userId: string) {
    this.client = client;
    this.userId = userId;
  }

  async fetchDashboard() {
    const baseUrl = `https://premium.schoolista.com/LCC/Student/Main.aspx?_sid=${this.userId}`;
    const res = await this.client.get(baseUrl);
    const $ = cheerio.load(res.data);
    const dashboardUrl = res.request.res.responseUrl || baseUrl;

    // Extract Period Code
    let periodCode = "SY2025-2026-2"; // Fallback
    $('a').each((_, el) => {
      const href = $(el).attr('href');
      if (href && href.includes('_pc=')) {
        const match = href.match(/_pc=([^&]+)/);
        if (match) {
          periodCode = match[1];
          return false;
        }
      }
    });

    return { $, periodCode, dashboardUrl, data: res.data };
  }

  async fetchEAF(periodCode: string) {
    const eafUrl = `https://premium.schoolista.com/LCC/Reports/Enrollment/LCC.EAF.aspx?_sid=${this.userId}&_pc=${periodCode}`;
    const res = await this.client.get(eafUrl);
    return { $: cheerio.load(res.data), data: res.data };
  }

  async fetchGrades(periodCode: string, dashboardUrl: string) {
    const gradesUrl = `https://premium.schoolista.com/LCC/Student/Main.aspx?_sid=${this.userId}&_pc=${periodCode}&_dm=Grades&_nm=`;
    const res = await this.client.get(gradesUrl, { headers: { 'Referer': dashboardUrl } });
    return { $: cheerio.load(res.data), data: res.data };
  }

  async fetchSubjectList(periodCode: string, dashboardUrl: string, dashboard$: cheerio.CheerioAPI) {
    let subjectListUrl = `https://premium.schoolista.com/LCC/Student/Main.aspx?_sid=${this.userId}&_pc=${periodCode}&_dm=SubjectList&_am=&_amval=&_amval2=&_nm=`;
    
    dashboard$('a').each((_, el) => {
      const href = dashboard$(el).attr('href');
      const text = dashboard$(el).text().trim();
      if (href && (href.toLowerCase().includes('subjectlist') || text.toLowerCase().includes('subject list'))) {
        let correctedHref = href.replace('/Gate/', '/Student/');
        subjectListUrl = new URL(correctedHref, dashboardUrl).toString();
        return false;
      }
    });

    const res = await this.client.get(subjectListUrl, { headers: { 'Referer': dashboardUrl } });
    return { $: cheerio.load(res.data), data: res.data };
  }

  parseStudentInfo($dashboard: cheerio.CheerioAPI, $eaf: cheerio.CheerioAPI): ScrapedStudentInfo {
    const pageText = $dashboard('body').text().replace(/\s+/g, ' ');
    
    // Extract Student Name
    let studentName = 
      $eaf('#fldName').text().trim() ||
      $dashboard('#lblStudentName').text().trim() || 
      $dashboard('#lblFullName').text().trim() ||
      $dashboard('#lblName').text().trim();

    if (!studentName || studentName.length < 3) {
      const nameIdMatch = pageText.match(new RegExp(`([^-
\|]+)\s+[-|]\s+${this.userId}`, 'i'));
      if (nameIdMatch) studentName = nameIdMatch[1].trim();
    }

    if (studentName) {
      studentName = studentName
        .replace(/^(Welcome|Student|User):\s*/i, '')
        .replace(new RegExp(this.userId, 'g'), '')
        .replace(/\s*[-|()]\s*$/, '')
        .replace(/^\s*[-|()]\s*/, '')
        .replace(/\s+/g, ' ')
        .trim();
    }

    const course = $eaf('#fldCourseDesc').text().trim() || 
                   pageText.match(/Bachelor of [^ ]+ in [^ ]+ [^ ]+/i)?.[0] || "Not specified";
    
    const email = pageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i)?.[0] || "";
    const address = `${$eaf('#fldAddress').text().trim()}, ${$eaf('#fldBrgy').text().trim()}, ${$eaf('#fldCity').text().trim()}`;
    const mobile = $eaf('#fldMobile').text().trim();
    const enrollmentDate = $eaf('#fldEnrolDate').text().trim();

    const yearLevel = $eaf('#fldLevelDesc').text().trim() || "Not specified";
    const semester = $eaf('#fldPrdDesc').text().trim().split(',')[0].trim() || "Not specified";

    return {
      name: studentName,
      course,
      email,
      yearLevel,
      semester,
      address,
      mobile,
      enrollmentDate,
      periodCode: "", // Set by caller
      dashboardUrl: "" // Set by caller
    };
  }

  parseSchedule($eaf: cheerio.CheerioAPI): ScrapedScheduleItem[] {
    const schedule: ScrapedScheduleItem[] = [];
    $eaf('#otbEnrollmentTable tr').each((i, row) => {
      if (i === 0) return; 
      const cells = $eaf(row).find('td');
      if (cells.length >= 6) {
        const units = $eaf(cells[3]).text().trim();
        if (!isNaN(parseFloat(units))) {
          schedule.push({
            subject: $eaf(cells[0]).text().trim(),
            description: $eaf(cells[1]).text().trim(),
            section: $eaf(cells[2]).text().trim(),
            units: units,
            time: $eaf(cells[4]).text().trim(),
            room: $eaf(cells[5]).text().trim()
          });
        }
      }
    });
    return schedule;
  }

  parseFinancials($eaf: cheerio.CheerioAPI): ScrapedFinancials {
    const installments: any[] = [];
    $eaf('#otbAssessmentAdjustmentDueSummaryTable tr').each((i, row) => {
      if (i === 0) return;
      const cells = $eaf(row).find('td');
      if (cells.length === 4) {
        installments.push({
          dueDate: $eaf(cells[0]).text().trim(),
          description: $eaf(cells[1]).text().trim(),
          assessed: $eaf(cells[2]).text().trim(),
          outstanding: $eaf(cells[3]).text().trim()
        });
      }
    });

    const assessment: any[] = [];
    $eaf('#otbAssessmentDetailsTable tr').each((i, row) => {
      const cells = $eaf(row).find('td');
      if (cells.length === 2 && !$eaf(row).find('.GroupHeaderText').length) {
        const desc = $eaf(cells[0]).text().trim();
        const amount = $eaf(cells[1]).text().trim();
        if (desc && amount) {
          assessment.push({ description: desc, amount: '₱' + amount.replace('₱', '') });
        }
      }
    });

    let totalAssessment = "---";
    let totalBalance = "---";
    const netTotalRow = $eaf('#otbAssessmentAdjustmentDueSummaryTable tr').last();
    const netTotalCells = netTotalRow.find('td');
    if (netTotalCells.length === 4) {
      totalAssessment = '₱' + $eaf(netTotalCells[2]).text().trim();
      totalBalance = '₱' + $eaf(netTotalCells[3]).text().trim();
    }

    return { total: totalAssessment, balance: totalBalance, installments, assessment };
  }

  parseReportCardLinks($grades: cheerio.CheerioAPI): any[] {
    const availableReports: any[] = [];
    $grades('a').each((_, el) => {
      const text = $grades(el).text().trim();
      const href = $grades(el).attr('href');
      if (href && text.startsWith("Grades of")) {
        availableReports.push({ text, href });
      }
    });
    return availableReports;
  }

  parseOfferedSubjects($subList: cheerio.CheerioAPI): ScrapedSubject[] {
    const offeredSubjects: ScrapedSubject[] = [];
    const table9 = $subList('table').eq(9);
    if (table9.length > 0) {
      const rows = table9.find('tr');
      rows.each((_, row) => {
        const cells = $subList(row).find('td');
        if (cells.length >= 8) {
          const code = $subList(cells[0]).text().trim();
          const desc = $subList(cells[1]).text().trim();
          const units = $subList(cells[3]).text().trim() || $subList(cells[2]).text().trim(); 
          const preReq = cells.length >= 6 ? $subList(cells[5]).text().trim() : "";
          if (code && desc && !code.toLowerCase().includes('subject')) {
            offeredSubjects.push({ code, description: desc, units, preReq });
          }
        }
      });
    }
    return offeredSubjects;
  }
}
