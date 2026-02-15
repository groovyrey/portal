import axios from 'axios';
import * as cheerio from 'cheerio';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import qs from 'querystring';
import fs from 'fs';

async function diagnose() {
    const jar = new CookieJar();
    const client = wrapper(axios.create({ 
        jar, 
        withCredentials: true,
        maxRedirects: 5,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Connection': 'keep-alive'
        }
    }));
    
    const userId = '20241322';
    const password = '09129927548';
    
    // Using the exact URL from your info.txt
    const baseUrl = `https://premium.schoolista.com/LCC/Student/Main.aspx?_sid=${userId}&_pc=SY2025-2026-2&_dm=Main&_nm=`;
    const loginUrl = 'https://premium.schoolista.com/LCC/Student/LCC.Login.aspx';

    try {
        console.log('--- STEP 1: INITIAL VISIT ---');
        const initRes = await client.get(baseUrl);
        const $init = cheerio.load(initRes.data);
        
        const formData = {};
        $init('input[type="hidden"]').each((_, el) => {
            formData[$init(el).attr('name')] = $init(el).val();
        });
        formData.otbUserID = userId;
        formData.otbPassword = password;
        formData.obtnLogin = 'LOGIN';

        console.log('Tokens found:', Object.keys(formData).filter(k => k.startsWith('__')));
        
        console.log('\n--- STEP 2: LOGIN POST ---');
        const loginRes = await client.post(loginUrl, qs.stringify(formData), {
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded', 
                'Referer': baseUrl,
                'Origin': 'https://premium.schoolista.com'
            }
        });

        console.log('Login Response URL:', loginRes.config.url);
        console.log('Login Status:', loginRes.status);
        
        if (loginRes.data.includes('USER ID') && loginRes.data.includes('PASSWORD')) {
            console.log('RESULT: Login FAILED (Still on login page)');
            fs.writeFileSync('login_failed_debug.html', loginRes.data);
            return;
        }

        console.log('RESULT: Login likely SUCCESSFUL');

        console.log('\n--- STEP 3: FETCHING REPORT CARD ---');
        // Let's try to get the link from the dashboard or use the known one
        const reportCardUrl = `https://premium.schoolista.com/LCC/Student/LCC.ReportCardHED.aspx?_sid=${userId}&_pc=SY2024-2025-2`;
        
        let rcRes = await client.get(reportCardUrl, {
            headers: { 'Referer': loginRes.config.url }
        });
        let $rc = cheerio.load(rcRes.data);

        if (rcRes.data.includes('ocbAcknowledgement')) {
            console.log('--- STEP 4: ACKNOWLEDGEMENT ---');
            const ackData = {};
            $rc('input[type="hidden"]').each((_, el) => {
                ackData[$rc(el).attr('name')] = $rc(el).val();
            });
            ackData['ocbAcknowledgement'] = 'on';
            ackData['obtnAcknowledgeAndProceed'] = 'Acknowledge and Proceed';

            rcRes = await client.post(reportCardUrl, qs.stringify(ackData), {
                headers: { 
                    'Content-Type': 'application/x-www-form-urlencoded', 
                    'Referer': reportCardUrl 
                }
            });
            $rc = cheerio.load(rcRes.data);
            console.log('Acknowledgement submitted.');
        }

        fs.writeFileSync('final_grades_debug.html', rcRes.data);
        console.log('\n--- FINAL VERIFICATION ---');
        console.log('Title:', $rc('title').text().trim());
        
        const subjects = [];
        $rc('table tr').each((_, row) => {
            const cells = $rc(row).find('td');
            if (cells.length >= 4) {
                const code = $rc(cells[0]).text().trim();
                if (code && code.length > 2 && !code.toLowerCase().includes('code')) {
                    subjects.push(code);
                }
            }
        });

        if (subjects.length > 0) {
            console.log('SUCCESS! Found', subjects.length, 'subjects.');
            console.log('Subjects:', subjects.join(', '));
        } else {
            console.log('FAILED: No subjects found in table.');
            console.log('Page snippet:', rcRes.data.replace(/\s+/g, ' ').substring(0, 500));
        }

    } catch (e) {
        console.error('\nFATAL ERROR:', e.message);
        if (e.response) {
            console.error('Status:', e.response.status);
            fs.writeFileSync('error_dump.html', e.response.data);
        }
    }
}

diagnose();
