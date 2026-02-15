import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import qs from 'querystring';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  let subDebug = "--- Login Diagnostic Started ---\n";
  try {
    const { userId, password } = await req.json();
    subDebug += `UserId: ${userId}\n`;

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
    
    // 3. Check for specific failure patterns
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
      $dashboard('.student-name').text().trim();

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
    const eafUrl = `https://premium.schoolista.com/LCC/Reports/Enrollment/LCC.EAF.aspx?_sid=${userId}&_pc=SY2025-2026-2`;
    const eafRes = await client.get(eafUrl);
    const $eaf = cheerio.load(eafRes.data);

    // Dynamic Subject List URL discovery
    let subjectListUrl = `https://premium.schoolista.com/LCC/Student/Main.aspx?_sid=${userId}&_pc=SY2025-2026-2&_dm=SubjectList&_am=&_amval=&_amval2=&_nm=`;
    subDebug += "Searching for SubjectList link in dashboard...\n";
    $dashboard('a').each((_, el) => {
        const href = $dashboard(el).attr('href');
        const text = $dashboard(el).text().toLowerCase();
        if (href && (href.includes('SubjectList') || text.includes('subject list') || text.includes('prospectus'))) {
            let rawHref = href;
            let correctedHref = href;
            // Fix: Case-insensitive replacement of /Gate/ with /Student/
            if (/\/(gate)\//i.test(correctedHref)) {
                correctedHref = correctedHref.replace(/\/(gate)\//i, '/Student/');
            }
            subjectListUrl = new URL(correctedHref, loginRes.config.url || 'https://premium.schoolista.com/LCC/Student/').toString();
            subDebug += `Found Link: ${text}\n  Raw: ${rawHref}\n  Corrected: ${subjectListUrl}\n`;
        }
    });

    const subListRes = await client.get(subjectListUrl, { headers: { 'Referer': loginRes.config.url } });
    const $sub = cheerio.load(subListRes.data);
    
    subDebug += `SubjectList Page Title: ${$sub('title').text()}\n`;
    if (subListRes.data.includes('otbUserID')) {
        subDebug += `ERROR: Redirected to login page while fetching SubjectList.\n`;
    }
    subDebug += `SubjectList Snippet: ${subListRes.data.substring(0, 300).replace(/\s+/g, ' ')}\n`;
    
    // 8. Extract Available Report Card Links
    const gradesUrl = `https://premium.schoolista.com/LCC/Student/Main.aspx?_sid=${userId}&_pc=SY2025-2026-2&_dm=Grades&_nm=`;
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

    const prospectus: any[] = [];
    let currentYear: any = null;
    let currentSem: any = null;
    const seenProspectus = new Set();
    subDebug += `--- Subject List Scraping --- Found ${$sub('table').length} tables.\n`;

    $sub('table').each((tIdx, table) => {
        const rows = $sub(table).find('tr');
        subDebug += `Table ${tIdx}: ${rows.length} rows\n`;
        
        rows.each((rIdx, row) => {
            const text = $sub(row).text().trim();
            if (text.match(/Year\s+Level/i)) {
                subDebug += `  Found Year: ${text}\n`;
                if (currentYear) prospectus.push(currentYear);
                currentYear = { year: text, semesters: [] };
                currentSem = null;
                return;
            }
            if (text.match(/\d(?:st|nd|rd|th)\s+Semester/i) && currentYear) {
                subDebug += `    Found Sem: ${text}\n`;
                currentSem = { semester: text, subjects: [] };
                currentYear.semesters.push(currentSem);
                return;
            }
            const cells = $sub(row).find('td');
            if (cells.length >= 4 && currentSem) {
                const code = $sub(cells[0]).text().trim();
                const desc = $sub(cells[1]).text().trim();
                
                // Adjust indices for 8-column vs original structure
                const units = $sub(cells[2]).text().trim();
                const preReq = cells.length >= 6 ? $sub(cells[5]).text().trim() : $sub(cells[3]).text().trim();

                if (code && desc && (units.match(/\d/) || code.length > 2)) {
                    const key = `${code}-${desc}`.toLowerCase();
                    if (!seenProspectus.has(key)) {
                        if (currentSem.subjects.length === 0) {
                            subDebug += `      Sample Subj (${cells.length} cols): ${code} - ${desc.substring(0, 20)}...\n`;
                        }
                        currentSem.subjects.push({ code, description: desc, units, preReq });
                        seenProspectus.add(key);
                    }
                }
            }
        });
    });
    if (currentYear) prospectus.push(currentYear);

    subDebug += `Total Prospectus Subjects: ${seenProspectus.size}\n`;

    // 7. Identify "Currently Offered" subjects (for the current sem/year)
    const currentSemText = semMatch ? semMatch[0] : "2nd Semester";
    const currentYearText = yearMatch ? `${yearMatch[1]}th Year` : "2nd Year";
    
    let offeredSubjects: any[] = [];
    const activeYearObj = prospectus.find(y => y.year.includes(yearMatch ? yearMatch[1] : "2"));
    if (activeYearObj) {
        const activeSemObj = activeYearObj.semesters.find((s: any) => s.semester.toLowerCase().includes(currentSemText.toLowerCase().split(' ')[0]));
        if (activeSemObj) {
            offeredSubjects = activeSemObj.subjects;
        }
    }

    // Financials
    const eafText = $eaf('body').text().replace(/\s+/g, ' ');
    const currencyRegex = /\d{1,3}(,\d{3})*(\.\d{2})/g;
    const allAmounts = eafText.match(currencyRegex) || [];
    let totalAssessment = "---";
    let totalBalance = "---";

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

                        if (studentName && studentName.length > 2) {
                          return NextResponse.json({
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
                              prospectus: prospectus.length > 0 ? prospectus : null,
                              offeredSubjects: offeredSubjects.length > 0 ? offeredSubjects : null,
                              availableReports: availableReports.length > 0 ? availableReports : null,
                              financials: { total: totalAssessment, balance: totalBalance }
                            }
                          });
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
