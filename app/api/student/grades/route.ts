import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import qs from 'querystring';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { db } from '@/lib/db';
import { doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { initDatabase } from '@/lib/db-init';
import { decrypt } from '@/lib/auth';

export async function POST(req: NextRequest) {
  let debugLog = "";
  try {
    const body = await req.json();
    const { href } = body;
    let { userId, password } = body;

    // Try to get credentials from session cookie if not provided in body
    const sessionCookie = req.cookies.get('session_token');
    if (sessionCookie && sessionCookie.value) {
      try {
        const decrypted = decrypt(sessionCookie.value);
        const sessionData = JSON.parse(decrypted);
        if (sessionData.userId && sessionData.password) {
          userId = sessionData.userId;
          password = sessionData.password;
        }
      } catch (e) {
        console.error('Failed to decrypt session cookie');
      }
    }

    if (!userId || !password || !href) {
      return NextResponse.json({ error: 'Missing required parameters or valid session' }, { status: 401 });
    }

    const jar = new CookieJar();
    const client = wrapper(axios.create({ 
      jar, 
      withCredentials: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      }
    }));
    
    // 1. Initial visit to get tokens
    const baseUrl = `https://premium.schoolista.com/LCC/Student/Main.aspx?_sid=${userId}&_pc=SY2025-2026-2&_dm=Main&_nm=`;
    debugLog += `Step 1: Visiting ${baseUrl}\n`;
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

    // 2. Perform Login
    debugLog += `Step 2: Performing POST login\n`;
    const loginAction = $init('#Login').attr('action') || './LCC.Login.aspx';
    const loginUrl = new URL(loginAction, finalInitUrl).toString();

    const loginRes = await client.post(loginUrl, qs.stringify(formData), {
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded', 
        'Referer': finalInitUrl,
        'Origin': 'https://premium.schoolista.com'
      }
    });

    if (loginRes.data.includes('unexpected error') || loginRes.data.includes('USER ID')) {
        debugLog += `ERROR: Login failed. Content starts with: ${loginRes.data.substring(0, 100)}\n`;
    } else {
        debugLog += `SUCCESS: Logged in successfully.\n`;
    }

    // 3. Visit the Report Card URL
    const reportCardUrl = new URL(href, 'https://premium.schoolista.com/LCC/Student/').toString();
    debugLog += `Step 3: Visiting Report Card: ${reportCardUrl}\n`;
    
    let res = await client.get(reportCardUrl, {
        headers: { 'Referer': finalInitUrl }
    });

    // If we were redirected back to login page even after "success" login
    if (res.data.includes('otbUserID') && res.data.includes('otbPassword')) {
        debugLog += `WARNING: Redirected to login page. Retrying one more time with main dashboard visit...\n`;
        await client.get(finalInitUrl); // Re-establish session context
        res = await client.get(reportCardUrl, {
            headers: { 'Referer': finalInitUrl }
        });
    }

    let $rc = cheerio.load(res.data);

    // 4. Handle Confirmation/Disclaimer Page
    if (res.data.includes('ocbAcknowledgement') || res.data.includes('Confirm') || res.data.includes('Disclaimer') || res.data.includes('obtnAcknowledgeAndProceed')) {
        debugLog += `Step 4: Handling acknowledgement/confirmation page\n`;
        const confirmData: any = {};
        $rc('input[type="hidden"], input[type="text"], input[type="password"]').each((_, el) => {
            const name = $rc(el).attr('name');
            if (name) confirmData[name] = $rc(el).val() || '';
        });
        
        // Check the acknowledgement checkbox if it exists
        if (res.data.includes('ocbAcknowledgement')) {
            confirmData['ocbAcknowledgement'] = 'on';
            debugLog += `  Found and checked ocbAcknowledgement checkbox.\n`;
        }

        // Auto-click the acknowledgement button or the first submit button
        const ackBtn = $rc('input[name="obtnAcknowledgeAndProceed"]');
        if (ackBtn.length > 0) {
            confirmData['obtnAcknowledgeAndProceed'] = ackBtn.val() || 'Acknowledge and Proceed';
            debugLog += `  Found obtnAcknowledgeAndProceed button.\n`;
        } else {
            const firstBtn = $rc('input[type="submit"]').first();
            if (firstBtn.length > 0) {
                confirmData[firstBtn.attr('name')!] = firstBtn.val() || '';
                debugLog += `  Using fallback submit button: ${firstBtn.attr('name')}\n`;
            }
        }

        debugLog += `  Submitting acknowledgement with ${Object.keys(confirmData).length} fields.\n`;

        res = await client.post(reportCardUrl, qs.stringify(confirmData), {
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded', 
                'Referer': reportCardUrl 
            }
        });
        $rc = cheerio.load(res.data);

        // Check if we are STILL on the acknowledgement page
        if (res.data.includes('ocbAcknowledgement') || res.data.includes('obtnAcknowledgeAndProceed')) {
            debugLog += `  WARNING: Still on acknowledgement page after submission. Redirection failed.\n`;
        } else {
            debugLog += `  Successfully moved past acknowledgement page. New Title: ${$rc('title').text()}\n`;
        }
    }
    
    // 5. Scrape the Grades Table
    let subjects: any[] = [];
    debugLog += `Scraping tables... Found ${$rc('table').length} tables.\n`;
    
    $rc('table').each((tIdx, table) => {
      const rows = $rc(table).find('tr');
      
      rows.each((rIdx, row) => {
        // Ensure the row belongs directly to this table (handle nested tables)
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
          let grade = "";
          let remarks = "";

          // Flexible column detection
          if (cells.length === 3) {
              desc = col0;
              code = col1;
              grade = col2;
              remarks = "N/A";
          } else {
              code = col0;
              desc = col1;
              
              cells.each((cIdx, cell) => {
                  const cellText = $rc(cell).text().trim();
                  if (/^(\d+\.?\d*|INC|DRP|PASS|FAIL)$/i.test(cellText) && cIdx > 1) {
                      grade = cellText;
                      remarks = $rc(cells[cIdx + 1]).text().trim() || $rc(cells[cells.length - 1]).text().trim();
                  }
              });

              if (!grade && cells.length >= 4) {
                  if (cells.length >= 7) {
                      grade = $rc(cells[cells.length - 2]).text().trim();
                      remarks = $rc(cells[cells.length - 1]).text().trim();
                  } else {
                      grade = $rc(cells[2]).text().trim();
                      remarks = $rc(cells[3]).text().trim();
                  }
              }
          }

          if (desc.length >= 3 && !desc.includes('Total') && !desc.includes('---')) {
              // Improve remarks fallback: If remarks are missing, generic "N/A", or "---", 
              // try to calculate "PASSED" based on the grade.
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
                  grade: grade || "---", 
                  remarks: finalRemarks
              });
          }
        }
      });
    });

    // De-duplication
    const seen = new Set();
    subjects = subjects.filter(s => {
      const key = `${s.description}-${s.code}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Save grades to database
    try {
      await initDatabase();
      
      if (!db) {
        throw new Error('Database not initialized');
      }

      // Try to extract report name from href (e.g., _nm=Grades+of+1st+Semester+SY+2024-2025)
      let reportName = 'Unknown Report';
      if (href.includes('_nm=')) {
        const match = href.match(/_nm=([^&]+)/);
        if (match) {
          reportName = decodeURIComponent(match[1].replace(/\+/g, ' '));
        }
      }

      if (subjects && subjects.length > 0) {
        // We use userId as the document ID for the grades collection.
        // This keeps the collection flat and easy to manage.
        const gradeRef = doc(db, 'grades', userId);
        
        await setDoc(gradeRef, {
          student_id: userId,
          report_name: reportName,
          items: subjects,
          updated_at: serverTimestamp()
        });
      }
    } catch (dbError) {
      console.error('Database sync error (grades):', dbError);
    }

    if (subjects.length === 0) {
      debugLog += `No subjects found. Page Title: ${$rc('title').text()}\n`;
      debugLog += `Page Snippet: ${res.data.substring(0, 1000).replace(/\s+/g, ' ')}\n`;
    }

    return NextResponse.json({ 
      success: true, 
      subjects,
      raw_snippet: debugLog
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, raw_snippet: debugLog });
  }
}
