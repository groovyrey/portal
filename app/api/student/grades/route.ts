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
    const loginRes = await client.post('https://premium.schoolista.com/LCC/Student/LCC.Login.aspx', qs.stringify(formData), {
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded', 
        'Referer': baseUrl,
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
        headers: { 'Referer': 'https://premium.schoolista.com/LCC/Student/Main.aspx' }
    });
    let $rc = cheerio.load(res.data);

    // 4. Handle Confirmation/Disclaimer Page
    if (res.data.includes('Confirm') || res.data.includes('VIEW') || res.data.includes('Disclaimer')) {
        debugLog += `Step 4: Handling confirmation page\n`;
        const confirmData: any = {};
        $rc('input[type="hidden"]').each((_, el) => {
            const name = $rc(el).attr('name');
            if (name) confirmData[name] = $rc(el).val() || '';
        });
        
        // Auto-click the first submit button
        const btnName = $rc('input[type="submit"]').first().attr('name');
        const btnVal = $rc('input[type="submit"]').first().val();
        if (btnName) confirmData[btnName] = btnVal;

        res = await client.post(reportCardUrl, qs.stringify(confirmData), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Referer': reportCardUrl }
        });
        $rc = cheerio.load(res.data);
    }
    
    // 5. Scrape the Grades Table
    const subjects: any[] = [];
    $rc('table tr').each((_, row) => {
      const cells = $rc(row).find('td');
      if (cells.length >= 4) {
        const code = $rc(cells[0]).text().trim();
        const desc = $rc(cells[1]).text().trim();
        const grade = $rc(cells[cells.length - 2]).text().trim();
        const remarks = $rc(cells[cells.length - 1]).text().trim();

        if (code.length > 2 && (grade.match(/\d/) || remarks.match(/Pass|Fail|Ext/i))) {
          subjects.push({ code, description: desc, grade, remarks });
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      subjects,
      raw_snippet: debugLog + "\n--- PAGE CONTENT ---\n" + res.data.substring(0, 10000).replace(/\s+/g, ' ')
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, debug: debugLog });
  }
}
