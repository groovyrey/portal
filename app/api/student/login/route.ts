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

import { getSessionClient, saveSession } from '@/lib/session-proxy';

export async function POST(req: NextRequest) {
    const { userId, password } = await req.json();
    try {

    if (!userId || !password) {
      return NextResponse.json({ error: 'UserID and Password are required' }, { status: 400 });
    }

    await initDatabase();

    // --- GHOST SESSION PROXY CHECK ---
    const { client, jar, isNew } = await getSessionClient(userId);
    const baseUrl = `https://premium.schoolista.com/LCC/Student/Main.aspx?_sid=${userId}`;
    let loginRes;

    if (!isNew) {
      // Re-use session: visit main dashboard directly
      loginRes = await client.get(baseUrl);
    } else {
      // Step 1: Initial visit to get tokens and Session ID
      const initRes = await client.get(baseUrl);
      const finalInitUrl = initRes.request.res.responseUrl || baseUrl;
      const $init = cheerio.load(initRes.data);

      const formData: any = {};
      $init('input[type="hidden"]').each((_, el) => {
        const name = $init(el).attr('name');
        if (name) formData[name] = $init(el).val() || '';
      });

      formData.otbUserID = userId;
      formData.otbPassword = password;
      formData.obtnLogin = 'LOGIN';

      let loginForm = $init('#Login');
      if (loginForm.length === 0) loginForm = $init('form').first();
      
      const loginAction = loginForm.attr('action') || './LCC.Login.aspx';
      const loginUrl = new URL(loginAction, finalInitUrl).toString();

      loginRes = await client.post(loginUrl, qs.stringify(formData), {
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': finalInitUrl,
          'Origin': 'https://premium.schoolista.com'
        },
      });

      // Save the session after a successful (first-time) login
      await saveSession(userId, jar);
    }
    // --- END PROXY LOGIC ---

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
    
    let course = courseMatch ? courseMatch[courseMatch.length - 1].trim() : "Not specified";

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

    const dashboardUrl = loginRes.request.res.responseUrl || baseUrl;

    // 6. Fetch Multiple Pages in Parallel for Speed
    const eafUrl = `https://premium.schoolista.com/LCC/Reports/Enrollment/LCC.EAF.aspx?_sid=${userId}&_pc=${periodCode}`;
    const gradesUrl = `https://premium.schoolista.com/LCC/Student/Main.aspx?_sid=${userId}&_pc=${periodCode}&_dm=Grades&_nm=`;
    
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

    // PARALLEL FETCH (Reduced to 3 requests from 4)
    const [eafRes, subListRes, gradesRes] = await Promise.all([
        client.get(eafUrl),
        client.get(subjectListUrl, { headers: { 'Referer': dashboardUrl } }),
        client.get(gradesUrl, { headers: { 'Referer': dashboardUrl } })
    ]);

    const $eaf = cheerio.load(eafRes.data);
    const $sub = cheerio.load(subListRes.data);
    const $grades = cheerio.load(gradesRes.data);
    
    // 7. Extract Student Info from EAF (More reliable)
    const eafName = $eaf('#fldName').text().trim();
    if (eafName) studentName = eafName;

    const eafCourse = $eaf('#fldCourseDesc').text().trim();
    if (eafCourse) course = eafCourse;

    const eafYear = $eaf('#fldLevelDesc').text().trim();
    const eafSem = $eaf('#fldPrdDesc').text().trim();
    
    // Extract Contact & Enrollment Info
    const address = `${$eaf('#fldAddress').text().trim()}, ${$eaf('#fldBrgy').text().trim()}, ${$eaf('#fldCity').text().trim()}`;
    const mobile = $eaf('#fldMobile').text().trim();
    const enrollmentDate = $eaf('#fldEnrolDate').text().trim();

    const yearLevel = eafYear || (yearMatch ? formatYearLevel(yearMatch[1]) : "2nd Year");
    const semesterStr = eafSem.split(',')[0].trim() || (semMatch ? semMatch[0] : "2nd Semester");

    // 8. Extract Schedule from EAF (Better structured)
    let finalSchedule: any[] = [];
    $eaf('#otbEnrollmentTable tr').each((i, row) => {
      if (i === 0) return; 
      const cells = $eaf(row).find('td');
      if (cells.length >= 6) {
        const units = $eaf(cells[3]).text().trim();
        if (!isNaN(parseFloat(units))) {
          finalSchedule.push({
            subject: $eaf(cells[0]).text().trim(), // This is the code
            description: $eaf(cells[1]).text().trim(),
            section: $eaf(cells[2]).text().trim(),
            units: units,
            time: $eaf(cells[4]).text().trim(),
            room: $eaf(cells[5]).text().trim()
          });
        }
      }
    });

    // 9. Extract Financials from EAF
    let installments: any[] = [];
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

    let eafAssessment: any[] = [];
    $eaf('#otbAssessmentDetailsTable tr').each((i, row) => {
        const cells = $eaf(row).find('td');
        if (cells.length === 2 && !$eaf(row).find('.GroupHeaderText').length) {
            const desc = $eaf(cells[0]).text().trim();
            const amount = $eaf(cells[1]).text().trim();
            if (desc && amount) {
                eafAssessment.push({ description: desc, amount: '₱' + amount.replace('₱', '') });
            }
        }
    });

    // Get Totals from the bottom of assessment table
    let totalAssessment = "---";
    let totalBalance = "---";
    const netTotalRow = $eaf('#otbAssessmentAdjustmentDueSummaryTable tr').last();
    const netTotalCells = netTotalRow.find('td');
    if (netTotalCells.length === 4) {
        totalAssessment = '₱' + $eaf(netTotalCells[2]).text().trim();
        totalBalance = '₱' + $eaf(netTotalCells[3]).text().trim();
    }

    // 10. Extract Available Report Card Links
    const availableReports: any[] = [];
    $grades('a').each((_, el) => {
        const text = $grades(el).text().trim();
        const href = $grades(el).attr('href');
        if (href && text.startsWith("Grades of")) {
            availableReports.push({ text, href });
        }
    });

    // 11. Scrape the Subject List (Prospectus Subjects)
    let offeredSubjects: any[] = [];
    const table9 = $sub('table').eq(9);
    if (table9.length > 0) {
        const rows = table9.find('tr');
        rows.each((rIdx, row) => {
            const cells = $sub(row).find('td');
            if (cells.length >= 8) {
                const code = $sub(cells[0]).text().trim();
                const desc = $sub(cells[1]).text().trim();
                const units = $sub(cells[3]).text().trim() || $sub(cells[2]).text().trim(); 
                const preReq = cells.length >= 6 ? $sub(cells[5]).text().trim() : "";
                if (code && desc && !code.toLowerCase().includes('subject')) {
                    offeredSubjects.push({ code, description: desc, units, preReq });
                }
            }
        });
    }

    // Save to database
    let existingSettings = null;
    let isNewUser = false;
    try {
      if (!db) {
        throw new Error('Firestore database is not initialized.');
      }
      await initDatabase();

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
        address: address,
        mobile: mobile,
        enrollment_date: enrollmentDate,
        updated_at: serverTimestamp()
      }, { merge: true });

      // Update Financials
      const financialRef = doc(db, 'financials', userId);
      await setDoc(financialRef, {
        total: totalAssessment,
        balance: totalBalance,
        due_today: "Check Assessment",
        details: {
            installments: installments,
            assessment: eafAssessment
        },
        updated_at: serverTimestamp()
      }, { merge: true });

      // Update Schedules
      if (finalSchedule && finalSchedule.length > 0) {
        const schedulesRef = doc(db, 'schedules', userId);
        await setDoc(schedulesRef, {
          items: finalSchedule,
          updated_at: serverTimestamp()
        });
      }

      // Update Prospectus Subjects using a Batch for efficiency
      if (offeredSubjects && offeredSubjects.length > 0) {
        const batch = writeBatch(db);
        // Firestore batches are limited to 500 operations
        const subjectsToProcess = offeredSubjects.slice(0, 450); 
        
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
      }
    } catch (dbError: any) {
      console.error('Database sync error:', dbError);
    }

    if (studentName && studentName.length > 2) {
        const encryptedSession = encrypt(JSON.stringify({ userId, password }));
        const response = NextResponse.json({
            success: true,
            isNewUser,
            data: { 
                name: studentName, 
                parsedName: parseStudentName(studentName),
                id: userId, 
                course, 
                email, 
                address,
                mobile,
                enrollment_date: enrollmentDate,
                semester: semesterStr,
                yearLevel: yearLevel,
                schedule: finalSchedule,
                offeredSubjects,
                availableReports,
                settings: existingSettings || { notifications: true, isPublic: true, showAcademicInfo: true },
                financials: { 
                    total: totalAssessment, 
                    balance: totalBalance,
                    installments,
                    assessment: eafAssessment
                }
            }
        });

        const isProd = process.env.NODE_ENV === 'production';
        response.cookies.set('session_token', encryptedSession, {
            httpOnly: true,
            secure: isProd && !req.nextUrl.hostname.includes('localhost'),
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
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
