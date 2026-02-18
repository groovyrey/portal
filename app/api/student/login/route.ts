import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import qs from 'querystring';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import fs from 'fs';
import path from 'path';
import { db } from '@/lib/db';
import { doc, setDoc, getDoc, serverTimestamp, collection, writeBatch } from 'firebase/firestore';
import { initDatabase } from '@/lib/db-init';
import { encrypt } from '@/lib/auth';
import { parseStudentName } from '@/lib/utils';

export async function POST(req: NextRequest) {
    const { userId, password } = await req.json();
    try {

    if (!userId || !password) {
      return NextResponse.json({ error: 'UserID and Password are required' }, { status: 400 });
    }

    const jar = new CookieJar();
    const client = wrapper(axios.create({ 
      jar, 
      withCredentials: true,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    }));

    const baseUrl = `https://premium.schoolista.com/LCC/Student/Main.aspx?_sid=${userId}`;
    
    // 1. Initial visit to get tokens and Session ID
    const initRes = await client.get(baseUrl);
    const finalInitUrl = initRes.request.res.responseUrl || baseUrl;
    const $init = cheerio.load(initRes.data);

    // Capture ALL hidden inputs (important for some ASP.NET configs)
    const formData: any = {};
    $init('input[type="hidden"]').each((_, el) => {
      const name = $init(el).attr('name');
      if (name) formData[name] = $init(el).val() || '';
    });

    // Add credentials and login button
    formData.otbUserID = userId;
    formData.otbPassword = password;
    formData.obtnLogin = 'LOGIN';

    // 2. Perform POST to the login page
    let loginForm = $init('#Login');
    if (loginForm.length === 0) loginForm = $init('form').first();
    
    const loginAction = loginForm.attr('action') || './LCC.Login.aspx';
    const loginUrl = new URL(loginAction, finalInitUrl).toString();

    const loginRes = await client.post(loginUrl, qs.stringify(formData), {
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': finalInitUrl,
        'Origin': 'https://premium.schoolista.com'
      },
    });

    const $dashboard = cheerio.load(loginRes.data);
    const dashboardTitle = $dashboard('title').text().trim();
    
    // 3. Extract Period Code (_pc) from dashboard links
    let periodCode = "SY2025-2026-2"; // Fallback
    $dashboard('a').each((_, el) => {
        const href = $dashboard(el).attr('href');
        if (href && href.includes('_pc=')) {
            const match = href.match(/_pc=([^&]+)/);
            if (match) {
                periodCode = match[1];
                return false; // break loop
            }
        }
    });


    // 4. Check for specific failure patterns
    if (loginRes.data.includes('unexpected error')) {
      const debugPath = path.join(process.cwd(), '.next', 'login_error.html');
      fs.writeFileSync(debugPath, loginRes.data);
      return NextResponse.json({ 
        success: false, 
        error: 'School portal session error. (Debug file saved to .next/login_error.html)' 
      }, { status: 401 });
    }

    // Improved failure check: If we are still on a page with a login button, login failed.
    const hasLoginButton = $dashboard('input[name="obtnLogin"], #obtnLogin, input[value="LOGIN"]').length > 0;
    if (hasLoginButton || (loginRes.data.includes('USER ID') && loginRes.data.includes('PASSWORD') && !dashboardTitle.toLowerCase().includes('dashboard') && !dashboardTitle.toLowerCase().includes('main'))) {
      const portalError = 
        $dashboard('#lblError').text().trim() || 
        $dashboard('#lblMessage').text().trim() || 
        $dashboard('.error-message').text().trim() ||
        $dashboard('.text-danger').text().trim();
      
      return NextResponse.json({ 
        success: false, 
        error: portalError || 'Invalid Student ID or Password.' 
      }, { status: 401 });
    }

    // 4. Extract Student Name - Aggressive Search
    let studentName = 
      $dashboard('#lblStudentName').text().trim() || 
      $dashboard('#lblFullName').text().trim() ||
      $dashboard('#lblName').text().trim() ||
      $dashboard('#lblStudent').text().trim() ||
      $dashboard('#lblUser').text().trim() ||
      $dashboard('.student-name').text().trim() ||
      $dashboard('.welcome-text').text().trim() ||
      $dashboard('.enrollment_student_info_cell_name').text().trim();

    const pageText = $dashboard('body').text().replace(/\s+/g, ' ');

    if (!studentName || studentName.length < 3) {
      // Try finding: Name - ID
      const nameIdMatch = pageText.match(new RegExp(`([^-\\n\\|]+)\\s+[-|]\\s+${userId}`, 'i'));
      if (nameIdMatch) studentName = nameIdMatch[1].trim();
    }

    if (!studentName || studentName.length < 3) {
      // Try finding: ID - Name
      const idNameMatch = pageText.match(new RegExp(`${userId}\\s+[-|]\\s+([^-\\n\\|]+)`, 'i'));
      if (idNameMatch) studentName = idNameMatch[1].trim();
    }

    if (!studentName || studentName.length < 3) {
      const welcomeMatch = pageText.match(/Welcome,?\s+([^!<\n\-]+)/i);
      if (welcomeMatch) studentName = welcomeMatch[1].trim();
    }

    // Sanitize name: remove extra titles and the Student ID itself if it leaked into the name
    if (studentName) {
        studentName = studentName
            .replace(/^(Welcome|Student|User):\s*/i, '')
            .replace(new RegExp(userId, 'g'), '') // Remove ID if present
            .replace(/\s*[-|()]\s*$/, '') // Remove trailing separators
            .replace(/^\s*[-|()]\s*/, '') // Remove leading separators
            .replace(/\s+/g, ' ') // Cleanup spaces
            .trim();
    }

    const courseMatch = pageText.match(/Bachelor of [^ ]+ in [^ ]+ [^ ]+/i) || 
                       pageText.match(/BS [^ ]+/i) ||
                       $dashboard('.enrollment_student_info_cell_course').text().trim() ||
                       pageText.match(new RegExp(`${userId}\\s+SY\\d{4}-\\d{4}-\\d\\s+(.*?) (User Setup|Logout|Main)`, 'i'));
    
    const course = courseMatch ? courseMatch[courseMatch.length - 1].trim() : "Not specified";

    const email = pageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i)?.[0] || "";
    const semMatch = pageText.match(/\d(?:st|nd|rd|th)\s+Semester/i);
    const yearMatch = pageText.match(/BSIS(\d)/i) || pageText.match(/Year\s+(\d)/i);

    const formatYearLevel = (year: string) => {
      const n = parseInt(year);
      if (isNaN(n)) return year;
      const s = ["th", "st", "nd", "rd"],
            v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]) + " Year";
    };

    // 5. Extract Schedule (Subjects)
    let schedule: any[] = [];
    $dashboard('table tr').each((_, row) => {
      const cells = $dashboard(row).find('td');
      if (cells.length >= 5) {
        const subject = $dashboard(cells[0]).text().trim();
        const section = $dashboard(cells[1]).text().trim();
        const units = $dashboard(cells[2]).text().trim();
        const time = $dashboard(cells[3]).text().trim();
        const room = $dashboard(cells[4]).text().trim();
        if (/^\d+\.\d+$/.test(units) && subject.length > 1) {
          schedule.push({ subject, section, units, time, room });
        }
      }
    });

    // De-duplicate schedule
    const seenSched = new Set();
    schedule = schedule.filter(s => {
      const key = `${s.subject}-${s.time}`.toLowerCase();
      if (seenSched.has(key)) return false;
      seenSched.add(key);
      return true;
    });
    const finalSchedule = schedule;

    const dashboardUrl = loginRes.request.res.responseUrl || baseUrl;

    // 6. Fetch Multiple Pages in Parallel for Speed
    const eafUrl = `https://premium.schoolista.com/LCC/Reports/Enrollment/LCC.EAF.aspx?_sid=${userId}&_pc=${periodCode}`;
    const gradesUrl = `https://premium.schoolista.com/LCC/Student/Main.aspx?_sid=${userId}&_pc=${periodCode}&_dm=Grades&_nm=`;
    const accountUrl = `https://premium.schoolista.com/LCC/Student/Main.aspx?_sid=${userId}&_pc=${periodCode}&_dm=Account&_nm=`;
    
    // Dynamic Subject List URL discovery
    let subjectListUrl = `https://premium.schoolista.com/LCC/Student/Main.aspx?_sid=${userId}&_pc=${periodCode}&_dm=SubjectList&_am=&_amval=&_amval2=&_nm=`;
    $dashboard('a').each((_, el) => {
        const href = $dashboard(el).attr('href');
        const text = $dashboard(el).text().trim();
        if (href && (href.toLowerCase().includes('subjectlist') || text.toLowerCase().includes('subject list'))) {
            let correctedHref = href.replace('/Gate/', '/Student/');
            subjectListUrl = new URL(correctedHref, dashboardUrl).toString();
            return false;
        }
    });

    // PARALLEL FETCH
    const [eafRes, subListRes, gradesRes, accRes] = await Promise.all([
        client.get(eafUrl),
        client.get(subjectListUrl, { headers: { 'Referer': dashboardUrl } }),
        client.get(gradesUrl, { headers: { 'Referer': dashboardUrl } }),
        client.get(accountUrl, { headers: { 'Referer': dashboardUrl } })
    ]);

    const $eaf = cheerio.load(eafRes.data);
    const $sub = cheerio.load(subListRes.data);
    const $grades = cheerio.load(gradesRes.data);
    const $acc = cheerio.load(accRes.data);
    
    // 7. Extract Available Report Card Links
    const availableReports: any[] = [];
    $grades('a').each((_, el) => {
        const text = $grades(el).text().trim();
        const href = $grades(el).attr('href');
        if (href && text.startsWith("Grades of")) {
            availableReports.push({ text, href });
        }
    });

    // 5. Scrape the Subject List (Targeting Table 9)
    let offeredSubjects: any[] = [];
    
    const table9 = $sub('table').eq(9);
    if (table9.length > 0) {
        const rows = table9.find('tr');

        rows.each((rIdx, row) => {
            const cells = $sub(row).find('td');
            
            // Subject rows
            if (cells.length >= 8) {
                const code = $sub(cells[0]).text().trim();
                const desc = $sub(cells[1]).text().trim();
                const units = $sub(cells[3]).text().trim() || $sub(cells[2]).text().trim(); 
                const preReq = cells.length >= 6 ? $sub(cells[5]).text().trim() : "";

                if (code && desc && !code.toLowerCase().includes('subject')) {
                    const subjObj = { code, description: desc, units, preReq };
                    
                    // Always add to offered list
                    offeredSubjects.push(subjObj);
                }
            }
        });
    }

    // 8. Financial Data Scraping (from parallel-fetched $acc)
    let dueAccounts: any[] = [];
    let payments: any[] = [];
    let installments: any[] = [];
    let adjustments: any[] = [];
    let scrapedTotal = "---";
    let scrapedBalance = "---";
    let scrapedDueToday = "---";

    // 1. Due Accounts (Statement of Account)
    const $dueTable = $acc('#otbStatementOfAccountTable');
    if ($dueTable.length > 0) {
        $dueTable.find('tr').each((i, row) => {
            const cells = $acc(row).find('td');
            if (cells.length === 5 && i > 1) { // Skip title and header
                const dueDate = $acc(cells[0]).text().trim();
                const description = $acc(cells[1]).text().trim();
                const amount = $acc(cells[2]).text().trim();
                const paid = $acc(cells[3]).text().trim();
                const due = $acc(cells[4]).text().trim();
                if (dueDate && description && !dueDate.toLowerCase().includes('total') && !dueDate.toLowerCase().includes('due')) {
                    dueAccounts.push({ dueDate, description, amount, paid, due });
                }
            }
        });
    }

    // 2. Payments
    const $paymentTable = $acc('#otbPaymentTable');
    if ($paymentTable.length > 0) {
        $paymentTable.find('tr').each((i, row) => {
            const cells = $acc(row).find('td');
            if (cells.length === 3 && i > 1) {
                const date = $acc(cells[0]).text().trim();
                const reference = $acc(cells[1]).text().trim();
                const amount = $acc(cells[2]).text().trim();
                if (date && reference && !date.toLowerCase().includes('paid')) {
                    payments.push({ date, reference, amount });
                }
            }
        });
    }

    // 3. Assessment of Fees (Installments)
    const $assessmentTable = $acc('#otbAssessmentDueDetailsTable');
    if ($assessmentTable.length > 0) {
        $assessmentTable.find('tr').each((i, row) => {
            const cells = $acc(row).find('td');
            const rowText = $acc(row).text().trim();

            if (cells.length === 4 && i > 3) { // Skip title1, title2, forwarded/balance, and header
                const dueDate = $acc(cells[0]).text().trim();
                const description = $acc(cells[1]).text().trim();
                const assessed = $acc(cells[2]).text().trim();
                const outstanding = $acc(cells[3]).text().trim();
                
                if (dueDate && description && !dueDate.toLowerCase().includes('due today') && !dueDate.toLowerCase().includes('net total')) {
                    installments.push({ dueDate, description, assessed, outstanding });
                }
            }

            // Extract Totals from this table
            if (rowText.includes('Net Total')) {
                const totalCells = $acc(row).find('td');
                if (totalCells.length >= 3) {
                    scrapedTotal = $acc(totalCells[totalCells.length - 2]).text().trim();
                    scrapedBalance = $acc(totalCells[totalCells.length - 1]).text().trim();
                }
            }

            if (rowText.includes('Due Today')) {
                const dueCells = $acc(row).find('td');
                if (dueCells.length >= 3) {
                    scrapedDueToday = $acc(dueCells[dueCells.length - 1]).text().trim();
                }
            }
        });
    }

    // 4. Adjustments
    const $adjustmentTable = $acc('#otbAdjustmentTable');
    if ($adjustmentTable.length > 0) {
        $adjustmentTable.find('tr').each((i, row) => {
            const cells = $acc(row).find('td');
            if (cells.length === 4 && i > 1) {
                const dueDate = $acc(cells[0]).text().trim();
                const description = $acc(cells[1]).text().trim();
                const adjustment = $acc(cells[2]).text().trim();
                const outstanding = $acc(cells[3]).text().trim();
                if (dueDate && description && !dueDate.toLowerCase().includes('total') && !dueDate.toLowerCase().includes('no adjustments')) {
                    adjustments.push({ dueDate, description, adjustment, outstanding });
                }
            }
        });
    }



    // Financials Summary (Fallback to EAF if not scraped from Account page)
    const eafText = $eaf('body').text().replace(/\s+/g, ' ');
    const currencyRegex = /\d{1,3}(,\d{3})*(\.\d{2})/g;
    const allAmounts = eafText.match(currencyRegex) || [];
    let totalAssessment = scrapedTotal !== "---" ? scrapedTotal : "---";
    let totalBalance = scrapedBalance !== "---" ? scrapedBalance : "---";

    if (totalAssessment === "---" || totalBalance === "---") {
        if (allAmounts.length >= 2) {
            const totalIdx = eafText.indexOf("Total Assessment");
            if (totalIdx !== -1) {
                const afterTotal = eafText.substring(totalIdx, totalIdx + 200);
                const matches = afterTotal.match(currencyRegex);
                if (matches) totalAssessment = matches.find(m => parseFloat(m.replace(/,/g, '')) > 0) || matches[0];
            }
            const balanceIdx = eafText.lastIndexOf("Balance");
            if (balanceIdx !== -1) {
                const afterBalance = eafText.substring(balanceIdx, balanceIdx + 200);
                const matches = afterBalance.match(currencyRegex);
                if (matches) totalBalance = matches[0];
            }
            if (totalAssessment === "---") totalAssessment = allAmounts.find(m => parseFloat(m.replace(/,/g, '')) > 500) || allAmounts[0] || "---";
            if (totalBalance === "---") totalBalance = allAmounts[allAmounts.length - 1] || "---";
        }
    }

    // Ensure currency symbol if missing
    if (totalAssessment !== "---" && !totalAssessment.includes('₱')) totalAssessment = '₱' + totalAssessment;
    if (totalBalance !== "---" && !totalBalance.includes('₱')) totalBalance = '₱' + totalBalance;
    if (scrapedDueToday !== "---" && !scrapedDueToday.includes('₱')) scrapedDueToday = '₱' + scrapedDueToday;

    // EAF Detailed Assessment Scraping
    let eafAssessment: any[] = [];
    $eaf('table tr').each((_, row) => {
        const cells = $eaf(row).find('td');
        if (cells.length === 2) {
            const desc = $eaf(cells[0]).text().trim();
            const amount = $eaf(cells[1]).text().trim();
            if (desc && amount && /^\d{1,3}(,\d{3})*(\.\d{2})/.test(amount)) {
                if (!desc.toLowerCase().includes('total') && !desc.toLowerCase().includes('assessment') && desc.length > 2) {
                    eafAssessment.push({ description: desc, amount: '₱' + amount.replace('₱', '') });
                }
            }
        }
    });

    // Save to database
    let existingSettings = null;
    let isNewUser = false;
    try {
      if (!db) {
        throw new Error('Firestore database is not initialized. Check your environment variables.');
      }
      await initDatabase();

      const yearLevel = yearMatch ? formatYearLevel(yearMatch[1]) : "2nd Year";
      const semesterStr = semMatch ? semMatch[0] : "2nd Semester";

      // Upsert Student
      const studentRef = doc(db, 'students', userId);
      const existingStudentDoc = await getDoc(studentRef);
      isNewUser = !existingStudentDoc.exists();
      existingSettings = existingStudentDoc.exists() ? existingStudentDoc.data().settings : null;

      await setDoc(studentRef, {
        name: studentName,
        course: course,
        email: email,
        year_level: yearLevel,
        semester: semesterStr,
        available_reports: availableReports,
        updated_at: serverTimestamp()
      }, { merge: true });

      // Update Financials
      const financialDetails = {
        dueAccounts: dueAccounts.length > 0 ? dueAccounts : null,
        payments: payments.length > 0 ? payments : null,
        installments: installments.length > 0 ? installments : null,
        adjustments: adjustments.length > 0 ? adjustments : null,
        assessment: eafAssessment.length > 0 ? eafAssessment : null
      };

      const financialRef = doc(db, 'financials', userId);
      await setDoc(financialRef, {
        total: totalAssessment,
        balance: totalBalance,
        due_today: scrapedDueToday,
        details: financialDetails,
        updated_at: serverTimestamp()
      }, { merge: true });

      // Update Schedules (Store as an array in a document)
      if (finalSchedule && finalSchedule.length > 0) {
        const schedulesRef = doc(db, 'schedules', userId);
        await setDoc(schedulesRef, {
          items: finalSchedule,
          updated_at: serverTimestamp()
        });
      }

      // Update Prospectus Subjects (Global cache)
      if (offeredSubjects && offeredSubjects.length > 0) {
        for (const sub of offeredSubjects) {
          const subRef = doc(db, 'prospectus_subjects', sub.code);
          await setDoc(subRef, {
            description: sub.description,
            units: sub.units,
            pre_req: sub.preReq,
            updated_at: serverTimestamp()
          }, { merge: true });
        }
      }
    } catch (dbError: any) {
      console.error('Database sync error:', dbError);
      if (dbError.code === 'not-found' || dbError.message?.includes('NOT_FOUND')) {
        console.error('CRITICAL: Firestore database not found. Please ensure Firestore is enabled in the Firebase Console and the Project ID is correct.');
      }
    }

    if (studentName && studentName.length > 2) {
        // Encrypt credentials for session cookie
        const sessionData = JSON.stringify({ userId, password });
        const encryptedSession = encrypt(sessionData);

        const response = NextResponse.json({
            success: true,
            isNewUser,
            data: { 
                name: studentName, 
                parsedName: parseStudentName(studentName),
                id: userId, 
                course, 
                email, 
                semester: semMatch ? semMatch[0] : "2nd Semester",
                yearLevel: yearMatch ? formatYearLevel(yearMatch[1]) : "2nd Year",
                schedule: finalSchedule.length > 0 ? finalSchedule : null,
                offeredSubjects: offeredSubjects.length > 0 ? offeredSubjects : null,
                availableReports: availableReports.length > 0 ? availableReports : null,
                settings: existingSettings || {
                    notifications: true,
                    isPublic: true,
                    showAcademicInfo: true
                },
                financials: { 
                    total: totalAssessment, 
                    balance: totalBalance,
                    dueToday: scrapedDueToday,
                    dueAccounts: dueAccounts.length > 0 ? dueAccounts : null,
                    payments: payments.length > 0 ? payments : null,
                    installments: installments.length > 0 ? installments : null,
                    adjustments: adjustments.length > 0 ? adjustments : null,
                    assessment: eafAssessment.length > 0 ? eafAssessment : null
                }
            }
        });

        // Set secure HttpOnly cookie
        // Use a more robust check for 'secure' to allow local testing
        const isProd = process.env.NODE_ENV === 'production';
        
        response.cookies.set('session_token', encryptedSession, {
            httpOnly: true,
            secure: isProd && !req.nextUrl.hostname.includes('localhost'),
            sameSite: 'lax', // Use 'lax' for better compatibility with redirections if any
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });

        return response;
    }

    const title = $dashboard('title').text() || "No Title";
    const snippet = pageText.substring(0, 1000).replace(/\s+/g, ' ');
    return NextResponse.json({ 
      success: false, 
      error: `Logged in to "${title}", but could not find student info. Page snippet: ${snippet}` 
    }, { status: 500 });

  } catch (error: any) {
    console.error('Scraping error:', error.message);
    return NextResponse.json({ success: false, error: 'The school server did not respond correctly.' }, { status: 500 });
  }
}
