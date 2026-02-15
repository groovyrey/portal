import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import qs from 'querystring';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

export async function POST(req: NextRequest) {
  let debugLog = "";
  try {
    const { userId, password, href } = await req.json();

    if (!userId || !password || !href) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
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
    if (res.data.includes('ocbAcknowledgement') || res.data.includes('Confirm') || res.data.includes('Disclaimer')) {
        debugLog += `Step 4: Handling acknowledgement/confirmation page\n`;
        const confirmData: any = {};
        $rc('input[type="hidden"]').each((_, el) => {
            const name = $rc(el).attr('name');
            if (name) confirmData[name] = $rc(el).val() || '';
        });
        
        // Check the acknowledgement checkbox if it exists
        if (res.data.includes('ocbAcknowledgement')) {
            confirmData['ocbAcknowledgement'] = 'on';
        }

        // Auto-click the acknowledgement button or the first submit button
        const ackBtn = $rc('input[name="obtnAcknowledgeAndProceed"]');
        if (ackBtn.length > 0) {
            confirmData['obtnAcknowledgeAndProceed'] = ackBtn.val() || 'Acknowledge and Proceed';
        } else {
            const firstBtn = $rc('input[type="submit"]').first();
            if (firstBtn.length > 0) {
                confirmData[firstBtn.attr('name')!] = firstBtn.val() || '';
            }
        }

        res = await client.post(reportCardUrl, qs.stringify(confirmData), {
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded', 
                'Referer': reportCardUrl 
            }
        });
        $rc = cheerio.load(res.data);
    }
    
    // 5. Scrape the Grades Table
    const subjects: any[] = [];
    // The grades are typically in a table inside #divMiddleTable or just a generic table
    $rc('table tr').each((_, row) => {
      const cells = $rc(row).find('td');
      // We look for rows that have subject-like data
      // Typical row: Code | Description | Prelim | Midterm | Final | ... | Grade | Remarks
      if (cells.length >= 4) {
        const text = $rc(row).text().toLowerCase();
        // Skip header rows
        if (text.includes('course') || text.includes('subject') || text.includes('description') || text.includes('units')) return;

        const code = $rc(cells[0]).text().trim();
        const desc = $rc(cells[1]).text().trim();
        
        // The grade is usually one of the last few columns
        // We'll try to find a column that looks like a numeric grade or has a final grade label
        let grade = "";
        let remarks = "";

        if (cells.length > 5) {
            // Usually: Code, Desc, Units, Prelim, Midterm, Final, Grade, Remarks
            // Let's take the second to last for grade and last for remarks if it's a long table
            grade = $rc(cells[cells.length - 2]).text().trim();
            remarks = $rc(cells[cells.length - 1]).text().trim();
        } else {
            grade = $rc(cells[2]).text().trim();
            remarks = $rc(cells[3]).text().trim();
        }

        // Basic validation: subject code should exist and be reasonably long
        if (code.length >= 3 && desc.length > 0 && !code.includes('Total')) {
            // Only add if there's some grade or remark, or it looks like a subject row
            if (grade || remarks || code.match(/[A-Z]{2,}/)) {
                subjects.push({ code, description: desc, grade, remarks });
            }
        }
      }
    });

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
