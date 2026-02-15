import axios from 'axios';
import * as cheerio from 'cheerio';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import qs from 'querystring';
import fs from 'fs';

async function diagnose() {
    const jar = new CookieJar();
    const client = wrapper(axios.create({ jar, withCredentials: true }));
    const userId = '20241322';
    const password = '09129927548';
    
    const loginPageUrl = 'https://premium.schoolista.com/LCC/Student/Main.aspx?_sid=' + userId;
    const loginPostUrl = 'https://premium.schoolista.com/LCC/Student/LCC.Login.aspx';
    const subjectListUrl = 'https://premium.schoolista.com/LCC/Student/Main.aspx?_sid=' + userId + '&_pc=SY2025-2026-2&_dm=SubjectList&_am=&_amval=&_amval2=&_nm=';

    console.log('1. Getting Login Page Tokens...');
    const initRes = await client.get(loginPageUrl);
    const $init = cheerio.load(initRes.data);
    
    const formData = {};
    $init('input[type="hidden"]').each((_, el) => {
        formData[$init(el).attr('name')] = $init(el).val();
    });
    formData.otbUserID = userId;
    formData.otbPassword = password;
    formData.obtnLogin = 'LOGIN';

    console.log('2. Logging in...');
    await client.post(loginPostUrl, qs.stringify(formData), {
        headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': loginPageUrl
        }
    });

    console.log('3. Fetching Subject List...');
    const res = await client.get(subjectListUrl);
    const $ = cheerio.load(res.data);
    
    console.log('4. Parsing Structure...');
    let structures = [];
    let currentYear = null;
    let currentSem = null;

    $('table tr').each((i, row) => {
        const text = $(row).text().trim();
        if (text.match(/Year\s+Level/i)) {
            currentYear = text;
            structures.push(`YEAR: ${text}`);
            return;
        }
        if (text.match(/\d(?:st|nd)\s+Semester/i)) {
            currentSem = text;
            structures.push(`  SEM: ${text}`);
            return;
        }
        const cells = $(row).find('td');
        if (cells.length >= 4) {
            const code = $(cells[0]).text().trim();
            const desc = $(cells[1]).text().trim();
            if (code && desc && code.length > 2 && !code.toLowerCase().includes('code')) {
                // Just log the first subject of each sem to verify
                if (currentSem) {
                    structures.push(`    SUBJ: ${code} - ${desc.substring(0, 30)}...`);
                    currentSem = null; // Only one sample per sem
                }
            }
        }
    });

    console.log('\n--- PORTAL STRUCTURE ---');
    console.log(structures.join('\n'));
    
    const bodyText = $('body').text().replace(/\s+/g, ' ');
    const yearMatch = bodyText.match(/Year\s+(\d)/i);
    const semMatch = bodyText.match(/\d(?:st|nd|rd|th)\s+Semester/i);
    
    console.log('\n--- DETECTED STUDENT CONTEXT ---');
    console.log('Detected Year:', yearMatch ? yearMatch[1] : 'Not Found');
    console.log('Detected Sem:', semMatch ? semMatch[0] : 'Not Found');
}

diagnose();
