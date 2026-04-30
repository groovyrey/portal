import * as cheerio from 'cheerio';
import { AxiosInstance } from 'axios';
import qs from 'querystring';
import { PORTAL_BASE, ORIGIN } from './constants';
import { aiExtract } from './ai-scraper';

export interface ScrapedStudentInfo {
  name: string;
  studentId?: string;
  course: string;
  yearLevel: string;
  section?: string;
  status?: string;
  enrollmentDate: string;
  address: string;
  mobile: string;
  email: string;
  gender?: string;
  nationality?: string;
  civilStatus?: string;
  totalUnits?: string;
  period?: string;
  semester: string;
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
  instructor: string;
}

export interface ScrapedFinancials {
  total: string;
  balance: string;
  netTotal?: string;
  netBalance?: string;
  dueToday?: string;
  dueAccounts?: any[];
  payments?: any[];
  installments: any[];
  assessment: any[];
  adjustments?: any[];
}

export class ScraperService {
  private client: AxiosInstance;
  private userId: string;

  constructor(client: AxiosInstance, userId: string) {
    this.client = client;
    this.userId = userId;
  }

  async fetchDashboard() {
    const baseUrl = `${PORTAL_BASE}/Student/Main.aspx?_sid=${this.userId}`;
    const res = await this.client.get(baseUrl);
    const $ = cheerio.load(res.data);
    const dashboardUrl = res.request.res.responseUrl || baseUrl;

    // Check if we are actually logged in
    const isLoggedOut = res.data.includes('obtnLogin') || res.data.includes('otbUserID');

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

    return { $, periodCode, dashboardUrl, data: res.data, isLoggedOut };
  }

  async fetchAllData(periodCode: string, dashboardUrl: string, dashboard$: cheerio.CheerioAPI) {
    const [eaf, grades, accounts] = await Promise.all([
      this.fetchEAF(periodCode),
      this.fetchGrades(periodCode, dashboardUrl),
      this.fetchAccounts(periodCode, dashboardUrl),
    ]);

    return { eaf, grades, accounts };
  }

  async fetchEAF(periodCode: string) {
    const eafUrl = `${PORTAL_BASE}/Reports/Enrollment/LCC.EAF.aspx?_sid=${this.userId}&_pc=${periodCode}`;
    const res = await this.client.get(eafUrl);
    return { $: cheerio.load(res.data), data: res.data };
  }

  async fetchGrades(periodCode: string, dashboardUrl: string) {
    const gradesUrl = `${PORTAL_BASE}/Student/Main.aspx?_sid=${this.userId}&_pc=${periodCode}&_dm=Grades&_nm=`;
    const res = await this.client.get(gradesUrl, { headers: { 'Referer': dashboardUrl } });
    return { $: cheerio.load(res.data), data: res.data };
  }

  async fetchAccounts(periodCode: string, dashboardUrl: string) {
    const accountsUrl = `${PORTAL_BASE}/Student/Main.aspx?_sid=${this.userId}&_pc=${periodCode}&_dm=Account&_nm=`;
    const res = await this.client.get(accountsUrl, { headers: { 'Referer': dashboardUrl } });
    return { $: cheerio.load(res.data), data: res.data };
  }

  async fetchReportCard(href: string, dashboardUrl: string) {
    const reportCardUrl = new URL(href, `${PORTAL_BASE}/Student/`).toString();
    let res = await this.client.get(reportCardUrl, {
        headers: { 'Referer': dashboardUrl }
    });

    if (res.data.includes('otbUserID') && res.data.includes('otbPassword')) {
        await this.client.get(dashboardUrl);
        res = await this.client.get(reportCardUrl, {
            headers: { 'Referer': dashboardUrl }
        });
    }

    let $rc = cheerio.load(res.data);

    if (res.data.includes('ocbAcknowledgement') || res.data.includes('Confirm') || res.data.includes('Disclaimer') || res.data.includes('obtnAcknowledgeAndProceed')) {
        const confirmData: any = {};
        $rc('input[type="hidden"], input[type="text"], input[type="password"]').each((_, el) => {
            const name = $rc(el).attr('name');
            if (name) confirmData[name] = $rc(el).val() || '';
        });
        
        if (res.data.includes('ocbAcknowledgement')) {
            confirmData['ocbAcknowledgement'] = 'on';
        }

        const ackBtn = $rc('input[name="obtnAcknowledgeAndProceed"]');
        if (ackBtn.length > 0) {
            confirmData['obtnAcknowledgeAndProceed'] = ackBtn.val() || 'Acknowledge and Proceed';
        } else {
            const firstBtn = $rc('input[type="submit"]').first();
            if (firstBtn.length > 0) {
                confirmData[firstBtn.attr('name')!] = firstBtn.val() || '';
            }
        }

        res = await this.client.post(reportCardUrl, qs.stringify(confirmData), {
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded', 
                'Referer': reportCardUrl 
            }
        });
        $rc = cheerio.load(res.data);
    }
    return { $: $rc, data: res.data };
  }

  async forceLogin(password: string) {
    const baseUrl = `${PORTAL_BASE}/Student/Main.aspx?_sid=${this.userId}`;
    const initRes = await this.client.get(baseUrl);
    const finalInitUrl = initRes.request.res.responseUrl || baseUrl;
    const $init = cheerio.load(initRes.data);

    const formData: any = {};
    $init('input[type="hidden"]').each((_, el) => {
      const name = $init(el).attr('name');
      if (name) formData[name] = $init(el).val() || '';
    });

    formData.otbUserID = this.userId;
    formData.otbPassword = password;
    formData.obtnLogin = 'LOGIN';

    const loginForm = $init('#Login').length ? $init('#Login') : $init('form').first();
    const loginAction = loginForm.attr('action') || './LCC.Login.aspx';
    const loginUrl = new URL(loginAction, finalInitUrl).toString();

    const loginRes = await this.client.post(loginUrl, qs.stringify(formData), {
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': finalInitUrl,
        'Origin': ORIGIN
      },
    });
    return { data: loginRes.data, $: cheerio.load(loginRes.data) };
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const changePassUrl = `${PORTAL_BASE}/User/ChangePassword.aspx`;
    const pageRes = await this.client.get(changePassUrl);
    const $page = cheerio.load(pageRes.data);

    const formData: any = {};
    $page('input[type="hidden"]').each((_, el) => {
        const name = $page(el).attr('name');
        if (name) formData[name] = $page(el).val() || '';
    });

    formData.otbPasswordChangeTable_1 = currentPassword;
    formData.otbPasswordChangeTable_2 = newPassword;
    formData.otbPasswordChangeTable_3 = newPassword;
    formData.obtnSaveNewPasword = 'Save new password';

    const action = $page('form').first().attr('action') || 'ChangePassword.aspx';
    const postUrl = new URL(action, changePassUrl).toString();

    const resultRes = await this.client.post(postUrl, qs.stringify(formData), {
        headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': changePassUrl
        }
    });

    return { 
      data: resultRes.data, 
      finalUrl: resultRes.request.res.responseUrl || "",
      $: cheerio.load(resultRes.data)
    };
  }

  async parseStudentInfo($dashboard: cheerio.CheerioAPI, $eaf: cheerio.CheerioAPI, rawDashboardHtml?: string, rawEafHtml?: string): Promise<ScrapedStudentInfo> {
    if (!$dashboard || !$eaf) {
       console.error('[Scraper] Missing Cheerio instances for student info parsing.');
       if (rawDashboardHtml || rawEafHtml) {
           const aiData = await aiExtract((rawDashboardHtml || "") + (rawEafHtml || ""), 'student_info', this.userId);
           if (aiData) return { ...aiData, periodCode: "", dashboardUrl: "" };
       }
       throw new Error('Could not parse student info: Missing data');
    }
    const pageText = $dashboard('body').text().replace(/\s+/g, ' ');
    
    let studentName = 
      $eaf('#fldName').text().trim() ||
      $dashboard('#lblStudentName').text().trim() || 
      $dashboard('#lblFullName').text().trim() ||
      $dashboard('#lblName').text().trim();

    if (!studentName && (rawDashboardHtml || rawEafHtml)) {
        const aiData = await aiExtract((rawDashboardHtml || "") + (rawEafHtml || ""), 'student_info', this.userId);
        if (aiData && aiData.name) {
            console.log(`[Scraper] AI Repair: Successfully recovered student info.`);
            return { ...aiData, periodCode: "", dashboardUrl: "" };
        }
    }

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
    
    const email = $eaf('#fldEMail').text().trim() || pageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i)?.[0] || "";
    const address = `${$eaf('#fldAddress').text().trim()}, ${$eaf('#fldBrgy').text().trim()}, ${$eaf('#fldCity').text().trim()}`;
    const mobile = $eaf('#fldMobile').text().trim();
    const enrollmentDate = $eaf('#fldEnrolDate').text().trim();

    const yearLevel = $eaf('#fldLevelDesc').text().trim() || "Not specified";
    const semester = $eaf('#fldPrdDesc').text().trim().split(',')[0].trim() || "Not specified";

    return {
      name: studentName,
      studentId: $eaf('#fldStuID').text().trim() || this.userId,
      course,
      yearLevel,
      section: $eaf('#fldSecCode').text().trim(),
      status: $eaf('#fldPrdStat').text().trim(),
      enrollmentDate,
      address,
      mobile,
      email,
      gender: $eaf('#fldGender').text().trim(),
      nationality: $eaf('#fldNationality').text().trim(),
      civilStatus: $eaf('#fldMStat').text().trim(),
      totalUnits: $eaf('#fldTUnits').text().trim(),
      period: $eaf('#fldPrdDesc').text().trim(),
      semester,
      periodCode: "",
      dashboardUrl: ""
    };
  }

  async parseSchedule($eaf: cheerio.CheerioAPI, rawHtml?: string): Promise<ScrapedScheduleItem[]> {
    if (!$eaf) return [];
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
            room: $eaf(cells[5]).text().trim(),
            instructor: cells.length >= 7 ? $eaf(cells[6]).text().trim() : "Not specified"
          });
        }
      }
    });

    if (schedule.length === 0 && rawHtml) {
        const aiData = await aiExtract(rawHtml, 'schedule', this.userId);
        if (Array.isArray(aiData) && aiData.length > 0) {
            return aiData;
        }
    }
    return schedule;
  }

  async parseFinancials($eaf: cheerio.CheerioAPI, rawHtml?: string): Promise<ScrapedFinancials> {
    if (!$eaf) return { total: "---", balance: "---", installments: [], assessment: [] } as any;
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

    if ((totalBalance === "---" || totalBalance === "₱") && rawHtml) {
        const aiData = await aiExtract(rawHtml, 'financials', this.userId);
        if (aiData && aiData.balance) {
            return aiData;
        }
    }

    return { 
      total: totalAssessment, 
      balance: totalBalance, 
      installments, 
      assessment,
      netTotal: '₱' + $eaf('#fldNetTotal').text().trim(),
      netBalance: '₱' + $eaf('#fldNetBalance').text().trim(),
      dueToday: '₱' + $eaf('#fldNetDueBalance').text().trim()
    };
  }

  parseAccounts($accounts: cheerio.CheerioAPI): Partial<ScrapedFinancials> {
    const dueAccounts: any[] = [];
    $accounts('#otbStatementOfAccountTable tr').each((i, row) => {
      if (i === 0 || $accounts(row).find('.HeaderText').length || $accounts(row).find('.FooterText').length) return;
      const cells = $accounts(row).find('td');
      if (cells.length >= 5) {
        dueAccounts.push({
          dueDate: $accounts(cells[0]).text().trim(),
          description: $accounts(cells[1]).text().trim(),
          amount: $accounts(cells[2]).text().trim(),
          paid: $accounts(cells[3]).text().trim(),
          due: $accounts(cells[4]).text().trim()
        });
      }
    });

    const payments: any[] = [];
    $accounts('#otbPaymentTable tr').each((i, row) => {
      if (i === 0 || $accounts(row).find('.HeaderText').length || $accounts(row).find('.FooterText').length) return;
      const cells = $accounts(row).find('td');
      if (cells.length >= 3) {
        payments.push({
          date: $accounts(cells[0]).text().trim(),
          reference: $accounts(cells[1]).text().trim(),
          amount: $accounts(cells[2]).text().trim()
        });
      }
    });

    const installments: any[] = [];
    $accounts('#otbAssessmentDueDetailsTable tr').each((i, row) => {
      if (i === 0 || $accounts(row).find('.HeaderText').length || $accounts(row).find('.FooterText').length || $accounts(row).find('.HeaderTitle').length) return;
      const cells = $accounts(row).find('td');
      if (cells.length >= 4) {
        const desc = $accounts(cells[1]).text().trim();
        if (desc.toLowerCase() !== 'adjustments' && !desc.toLowerCase().includes('total')) {
          installments.push({
            dueDate: $accounts(cells[0]).text().trim(),
            description: desc,
            assessed: $accounts(cells[2]).text().trim(),
            outstanding: $accounts(cells[3]).text().trim()
          });
        }
      }
    });

    const adjustments: any[] = [];
    $accounts('#otbAdjustmentTable tr').each((i, row) => {
       if (i === 0 || $accounts(row).find('.HeaderText').length || $accounts(row).find('.FooterText').length || $accounts(row).find('.HeaderTitle').length) return;
       const cells = $accounts(row).find('td');
       if (cells.length >= 4) {
          adjustments.push({
             dueDate: $accounts(cells[0]).text().trim(),
             description: $accounts(cells[1]).text().trim(),
             adjustment: $accounts(cells[2]).text().trim(),
             outstanding: $accounts(cells[3]).text().trim()
          });
       }
    });

    const assessmentTable = $accounts('#otbAssessmentDueDetailsTable');
    let totalAssessment = undefined;
    let totalBalance = undefined;
    let dueToday = undefined;

    assessmentTable.find('tr').each((_, row) => {
      const text = $accounts(row).text().toLowerCase();
      const cells = $accounts(row).find('td');
      
      if ((text.includes('net total') || text.includes('grand total')) && cells.length >= 3) {
        totalAssessment = '₱' + $accounts(cells[cells.length - 2]).text().trim();
        totalBalance = '₱' + $accounts(cells[cells.length - 1]).text().trim();
      }
      if (text.includes('due today') && cells.length >= 2) {
        dueToday = '₱' + $accounts(cells[cells.length - 1]).text().trim();
      }
    });

    return { 
      dueAccounts, 
      payments, 
      installments,
      dueToday,
      total: totalAssessment,
      balance: totalBalance,
      adjustments 
    };
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

  async parseReportCard($rc: cheerio.CheerioAPI, rawHtml?: string): Promise<any[]> {
    const subjects: any[] = [];
    $rc('table').each((tIdx, table) => {
      const rows = $rc(table).find('tr');
      rows.each((rIdx, row) => {
        if ($rc(row).closest('table')[0] !== table) return;

        const cells = $rc(row).find('td');
        if (cells.length >= 3) {
          const col0 = $rc(cells[0]).text().trim();
          const col1 = $rc(cells[1]).text().trim();
          const col2 = $rc(cells[2]).text().trim();
          
          const text = $rc(row).text().toLowerCase();
          if (text.includes('course') || text.includes('subject') || text.includes('description') || text.includes('units')) return;

          let code = "";
          let desc = "";
          let section = "";
          let units = "";
          let grade = "";
          let remarks = "";

          if (cells.length === 3) {
              const isSectionAtStart = /^[A-Z]{2,}-?\d[A-Z]$/i.test(col0) || /^[A-Z]{2,}\d-?[A-Z]{1,2}-?[A-Z]?$/i.test(col0);
              if (isSectionAtStart && col0.length < 15) {
                  code = col1;
                  grade = col2;
                  desc = "Unknown Subject";
              } else {
                  desc = col0;
                  section = col1;
                  code = col1; 
                  grade = col2;
              }
              remarks = "N/A";
          } else {
              const isSectionAtStart = cells.length >= 4 && (/^[A-Z]{2,}-?\d[A-Z]$/i.test(col0) || /^[A-Z]{2,}\d-?[A-Z]{1,2}-?[A-Z]?$/i.test(col0)) && col0.length < 15;
              if (isSectionAtStart) {
                code = col1;
                desc = col2;
              } else {
                code = col0;
                desc = col1;
              }
              
              units = "";
              const numericCells: { idx: number, val: string }[] = [];
              cells.each((cIdx, cell) => {
                  const cellText = $rc(cell).text().trim();
                  if (/^(\d+\.?\d*|INC|DRP|PASS|FAIL)$/i.test(cellText) && cIdx > 1) {
                      numericCells.push({ idx: cIdx, val: cellText });
                  }
              });

              if (numericCells.length >= 2) {
                  const gradeCandidate = numericCells[numericCells.length - 1];
                  grade = gradeCandidate.val;
                  remarks = $rc(cells[gradeCandidate.idx + 1]).text().trim() || $rc(cells[cells.length - 1]).text().trim();
                  const unitsCandidate = numericCells[numericCells.length - 2];
                  if (unitsCandidate && /^\d+(\.\d+)?$/.test(unitsCandidate.val)) {
                      const uVal = parseFloat(unitsCandidate.val);
                      if (uVal > 0 && uVal <= 10) units = unitsCandidate.val;
                  }
              } else if (numericCells.length === 1) {
                  grade = numericCells[0].val;
                  remarks = $rc(cells[numericCells[0].idx + 1]).text().trim() || $rc(cells[cells.length - 1]).text().trim();
              }

              if (!grade && cells.length >= 4) {
                  if (cells.length >= 7) {
                      grade = $rc(cells[cells.length - 2]).text().trim();
                      remarks = $rc(cells[cells.length - 1]).text().trim();
                  } else {
                      const gradeIdx = isSectionAtStart ? 3 : 2;
                      const remarksIdx = isSectionAtStart ? 4 : 3;
                      grade = $rc(cells[gradeIdx]).text().trim();
                      remarks = $rc(cells[remarksIdx]).text().trim();
                  }
              }
          }

          if (desc.length >= 3 && !desc.includes('Total') && !desc.includes('---')) {
              let finalRemarks = remarks;
              if (!finalRemarks || finalRemarks === "N/A" || finalRemarks === "---") {
                  const numGrade = parseFloat(grade);
                  if (!isNaN(numGrade) && numGrade > 0) {
                      finalRemarks = numGrade <= 3.0 ? "PASSED" : (numGrade >= 75 ? "PASSED" : "FAILED");
                  } else {
                      finalRemarks = "N/A";
                  }
              }

              subjects.push({ 
                  code: code || "SUBJ", 
                  description: desc, 
                  section: section,
                  grade: grade || "---", 
                  units: units || "0",
                  remarks: finalRemarks
              });
          }
        }
      });
    });

    if (subjects.length === 0 && rawHtml) {
        const aiData = await aiExtract(rawHtml, 'grades', this.userId);
        if (Array.isArray(aiData) && aiData.length > 0) {
            return aiData;
        }
    }

    const seen = new Set();
    return subjects.filter(s => {
      const key = `${s.description}-${s.code}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
