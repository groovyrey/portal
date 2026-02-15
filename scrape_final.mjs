import axios from 'axios';
import * as cheerio from 'cheerio';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import qs from 'querystring';
import fs from 'fs';

async function scrape() {
    const jar = new CookieJar();
    const client = wrapper(axios.create({ 
        jar, 
        withCredentials: true,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        }
    }));

    const userId = '20241322';
    const password = '09129927548';
    
    // Semesters to try if one fails
    const semesters = ['SY2024-2025-2', 'SY2024-2025-1', 'SY2025-2026-1'];
    const pc = semesters[0];

    const baseUrl = `https://premium.schoolista.com/LCC/Student/Main.aspx?_sid=${userId}&_pc=${pc}&_dm=Main&_nm=`;
    const loginUrl = 'https://premium.schoolista.com/LCC/Student/LCC.Login.aspx';
    const reportCardUrl = `https://premium.schoolista.com/LCC/Student/LCC.ReportCardHED.aspx?_sid=${userId}&_pc=${pc}`;

    try {
        console.log('1. Visiting Main Page...');
        const initRes = await client.get(baseUrl);
        const $init = cheerio.load(initRes.data);
        
        const loginData = {};
        $init('input[type="hidden"]').each((_, el) => {
            loginData[$init(el).attr('name')] = $init(el).val();
        });
        loginData.otbUserID = userId;
        loginData.otbPassword = password;
        loginData.obtnLogin = 'LOGIN';

        console.log('2. Posting Login...');
        await client.post(loginUrl, qs.stringify(loginData), {
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded',
                'Referer': baseUrl
            }
        });

        console.log('3. Fetching Report Card...');
        let rcRes = await client.get(reportCardUrl, {
            headers: { 'Referer': baseUrl }
        });
        let $rc = cheerio.load(rcRes.data);

        // Handle Acknowledgement
        if (rcRes.data.includes('ocbAcknowledgement')) {
            console.log('4. Handling Acknowledgement Page...');
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
        }

        console.log('5. Parsing Grades...');
        const subjects = [];
        $rc('table tr').each((_, row) => {
            const cells = $rc(row).find('td');
            if (cells.length >= 4) {
                const code = $rc(cells[0]).text().trim();
                const desc = $rc(cells[1]).text().trim();
                
                // Header skip
                if (code.toLowerCase().includes('code') || code.toLowerCase().includes('subject')) return;

                let grade = $rc(cells[cells.length - 2]).text().trim();
                let remarks = $rc(cells[cells.length - 1]).text().trim();

                if (code && desc) {
                    subjects.push({ code, desc, grade, remarks });
                }
            }
        });

        console.log('RESULTS:');
        console.table(subjects);
        
        fs.writeFileSync('grades_final_output.json', JSON.stringify(subjects, null, 2));
        console.log('Saved to grades_final_output.json');

    } catch (error) {
        console.error('ERROR:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            fs.writeFileSync('error_dump.html', error.response.data);
        }
    }
}

scrape();
