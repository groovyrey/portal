import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import qs from 'querystring';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import fs from 'fs';
import path from 'path';
import { sql } from '@/lib/db';
import { initDatabase } from '@/lib/db-init';
import { encrypt } from '@/lib/auth';

export async function POST(req: NextRequest) {
    const { userId, password } = await req.json();
    let subDebug = "";
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

    const baseUrl = `https://premium.schoolista.com/LCC/Student/Main.aspx?_sid=${userId}&_pc=SY2025-2026-2&_dm=Main&_nm=`;
    
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
    const loginAction = $init('#Login').attr('action') || './LCC.Login.aspx';
    const loginUrl = new URL(loginAction, finalInitUrl).toString();

    const loginRes = await client.post(loginUrl, qs.stringify(formData), {
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': finalInitUrl,
        'Origin': 'https://premium.schoolista.com'
      },
    });

    const $dashboard = cheerio.load(loginRes.data);
    
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

    if (loginRes.data.includes('USER ID') && loginRes.data.includes('PASSWORD')) {
      return NextResponse.json({ success: false, error: 'Invalid Student ID or Password.' }, { status: 401 });
    }

    // 4. Extract Student Name - Aggressive Search
    let studentName = 
      $dashboard('#lblStudentName').text().trim() || 
      $dashboard('#lblFullName').text().trim() ||
      $dashboard('#lblName').text().trim() ||
      $dashboard('.student-name').text().trim() ||
      $dashboard('.enrollment_student_info_cell_name').text().trim();

    const pageText = $dashboard('body').text().replace(/\s+/g, ' ');

    if (!studentName || studentName.length < 3) {
      const nameIdMatch = pageText.match(new RegExp(`([^-\\n]+)\\s+-\\s+${userId}`, 'i'));
      if (nameIdMatch) studentName = nameIdMatch[1].trim();
    }

    if (!studentName || studentName.length < 3) {
      const welcomeMatch = pageText.match(/Welcome,?\s+([^!<\n\-]+)/i);
      if (welcomeMatch) studentName = welcomeMatch[1].trim();
    }

    const courseMatch = pageText.match(/Bachelor of [^ ]+ in [^ ]+ [^ ]+/i) || 
                       pageText.match(/BS [^ ]+/i) ||
                       $dashboard('.enrollment_student_info_cell_course').text().trim() ||
                       pageText.match(new RegExp(`${userId}\\s+SY\\d{4}-\\d{4}-\\d\\s+(.*?) (User Setup|Logout|Main)`, 'i'));
    
    const course = courseMatch ? courseMatch[courseMatch.length - 1].trim() : "Not specified";

    const gender = pageText.match(/Male|Female/i)?.[0] || "";
    const email = pageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i)?.[0] || "";
    const contact = pageText.match(/09\d{9}/i)?.[0] || "";
    const semMatch = pageText.match(/\d(?:st|nd|rd|th)\s+Semester/i);
    const yearMatch = pageText.match(/BSIS(\d)/i) || pageText.match(/Year\s+(\d)/i);
    const addressMatch = pageText.match(/(?:Male|Female)\s+(.*?)\s+(?:San Jose|Bulacan|Philippines)/i);
    const address = addressMatch ? `${addressMatch[1].trim()} San Jose Del Monte, Bulacan` : "";

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

    // 6. Fetch EAF and Subject List
    const eafUrl = `https://premium.schoolista.com/LCC/Reports/Enrollment/LCC.EAF.aspx?_sid=${userId}&_pc=${periodCode}`;
    const eafRes = await client.get(eafUrl);
    const $eaf = cheerio.load(eafRes.data);

    // Dynamic Subject List URL discovery from the dashboard
    let subjectListUrl = "";

    $dashboard('a').each((_, el) => {
        const href = $dashboard(el).attr('href');
        const text = $dashboard(el).text().trim();
        if (href && (href.toLowerCase().includes('subjectlist') || text.toLowerCase().includes('subject list') || text.toLowerCase().includes('prospectus'))) {
            let correctedHref = href;
            if (correctedHref.includes('/Gate/')) {
                correctedHref = correctedHref.replace('/Gate/', '/Student/');
            }
            const absoluteUrl = new URL(correctedHref, loginRes.request.res.responseUrl || loginRes.config.url || 'https://premium.schoolista.com/LCC/Student/').toString();

            if (!subjectListUrl) subjectListUrl = absoluteUrl;
        }
    });

    if (!subjectListUrl) {

        subjectListUrl = `https://premium.schoolista.com/LCC/Student/Main.aspx?_sid=${userId}&_pc=${periodCode}&_dm=SubjectList&_am=&_amval=&_amval2=&_nm=`;
    }


    const dashboardUrl = loginRes.request.res.responseUrl || baseUrl;

    const subListRes = await client.get(subjectListUrl, { 
        headers: { 'Referer': dashboardUrl } 
    });
    const $sub = cheerio.load(subListRes.data);
    


    if (subListRes.data.includes('otbUserID')) {

    }

    
    // 8. Extract Available Report Card Links
    const gradesUrl = `https://premium.schoolista.com/LCC/Student/Main.aspx?_sid=${userId}&_pc=${periodCode}&_dm=Grades&_nm=`;
    const gradesRes = await client.get(gradesUrl, { headers: { 'Referer': baseUrl } });
    const $grades = cheerio.load(gradesRes.data);
    
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

    // 8. Financials & Ledger Scraping
    const accountUrl = `https://premium.schoolista.com/LCC/Student/Main.aspx?_sid=${userId}&_pc=${periodCode}&_dm=Account&_nm=`;
    const accRes = await client.get(accountUrl, { headers: { 'Referer': subListRes.config.url || baseUrl } });
    
    // User requested to ONLY have the account page raw output for diagnostic
    subDebug = `--- Account Page Diagnostic ---\nURL: ${accountUrl}\n\nRAW_HTML_START\n${accRes.data}\nRAW_HTML_END\n\n--- EAF Page Diagnostic ---\nURL: ${eafUrl}\n\nRAW_HTML_START\n${eafRes.data}\nRAW_HTML_END`;
    
    const $acc = cheerio.load(accRes.data);
    
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
    try {
      await initDatabase();

      const yearLevel = yearMatch ? `${yearMatch[1]}th Year` : "2nd Year";
      const semesterStr = semMatch ? semMatch[0] : "2nd Semester";

      // Upsert Student
      await sql`
        INSERT INTO students (id, name, course, gender, address, contact, email, year_level, semester)
        VALUES (${userId}, ${studentName}, ${course}, ${gender}, ${address}, ${contact}, ${email}, ${yearLevel}, ${semesterStr})
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          course = EXCLUDED.course,
          gender = EXCLUDED.gender,
          address = EXCLUDED.address,
          contact = EXCLUDED.contact,
          email = EXCLUDED.email,
          year_level = EXCLUDED.year_level,
          semester = EXCLUDED.semester,
          updated_at = CURRENT_TIMESTAMP
      `;

      // Update Financials
      const financialDetails = {
        dueAccounts: dueAccounts.length > 0 ? dueAccounts : null,
        payments: payments.length > 0 ? payments : null,
        installments: installments.length > 0 ? installments : null,
        adjustments: adjustments.length > 0 ? adjustments : null,
        assessment: eafAssessment.length > 0 ? eafAssessment : null
      };

      await sql`
        INSERT INTO financials (student_id, total, balance, due_today, details)
        VALUES (${userId}, ${totalAssessment}, ${totalBalance}, ${scrapedDueToday}, ${JSON.stringify(financialDetails)})
        ON CONFLICT (student_id) DO UPDATE SET
          total = EXCLUDED.total,
          balance = EXCLUDED.balance,
          due_today = EXCLUDED.due_today,
          details = EXCLUDED.details,
          updated_at = CURRENT_TIMESTAMP
      `;

      // Update Schedules (Delete old and insert new)
      if (finalSchedule && finalSchedule.length > 0) {
        await sql`DELETE FROM schedules WHERE student_id = ${userId}`;
        for (const s of finalSchedule) {
          await sql`
            INSERT INTO schedules (student_id, subject, section, units, time, room)
            VALUES (${userId}, ${s.subject}, ${s.section}, ${s.units}, ${s.time}, ${s.room})
          `;
        }
      }

      // Update Prospectus Subjects (Global cache)
      if (offeredSubjects && offeredSubjects.length > 0) {
        for (const sub of offeredSubjects) {
          await sql`
            INSERT INTO prospectus_subjects (code, description, units, pre_req)
            VALUES (${sub.code}, ${sub.description}, ${sub.units}, ${sub.preReq})
            ON CONFLICT (code) DO UPDATE SET
              description = EXCLUDED.description,
              units = EXCLUDED.units,
              pre_req = EXCLUDED.pre_req,
              updated_at = CURRENT_TIMESTAMP
          `;
        }
      }
    } catch (dbError) {
      console.error('Database sync error:', dbError);
    }

    if (studentName && studentName.length > 2) {
        // Encrypt credentials for session cookie
        const sessionData = JSON.stringify({ userId, password });
        const encryptedSession = encrypt(sessionData);

        const response = NextResponse.json({
            success: true,
            debugLog: subDebug,
            data: { 
                name: studentName, 
                id: userId, 
                course, 
                gender, 
                email, 
                contact, 
                address,
                semester: semMatch ? semMatch[0] : "2nd Semester",
                yearLevel: yearMatch ? `${yearMatch[1]}th Year` : "2nd Year",
                schedule: finalSchedule.length > 0 ? finalSchedule : null,
                offeredSubjects: offeredSubjects.length > 0 ? offeredSubjects : null,
                availableReports: availableReports.length > 0 ? availableReports : null,
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
        response.cookies.set('session_token', encryptedSession, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });

        return response;
    }
    const title = $dashboard('title').text();
    const snippet = pageText.substring(0, 500).replace(/\s+/g, ' ');
    return NextResponse.json({ 
      success: false, 
      error: `Successfully logged in to "${title}", but could not find name. Page snippet: ${snippet}` 
    }, { status: 500 });

  } catch (error: any) {
    console.error('Scraping error:', error.message);
    return NextResponse.json({ success: false, error: 'The school server did not respond correctly.' }, { status: 500 });
  }
}
