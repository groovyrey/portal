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
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        }
    }));
    
    const userId = '20241322';
    const password = '09129927548';
    
    const baseUrl = 'https://premium.schoolista.com/LCC/Student/Main.aspx?_sid=' + userId;
    const reportCardUrl = 'https://premium.schoolista.com/LCC/Student/LCC.ReportCardHED.aspx?_sid=20241322&_pc=SY2024-2025-2';
    const loginUrl = 'https://premium.schoolista.com/LCC/Student/LCC.Login.aspx';

    console.log('1. Initializing Session...');
    const initRes = await client.get(baseUrl);
    const $init = cheerio.load(initRes.data);
    
    const formData = {};
    $init('input[type="hidden"]').each((_, el) => {
        formData[$init(el).attr('name')] = $init(el).val();
    });
    formData.otbUserID = userId;
    formData.otbPassword = password;
    formData.obtnLogin = 'LOGIN';

    console.log('2. Logging in...');
    await client.post(loginUrl, qs.stringify(formData), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Referer': baseUrl }
    });

    console.log('3. Fetching Report Card...');
    let res = await client.get(reportCardUrl, { headers: { 'Referer': baseUrl } });
    let $ = cheerio.load(res.data);

    if (res.data.includes('ocbAcknowledgement')) {
        console.log('4. Handling Acknowledgement Page...');
        const ackData = {};
        $('input[type="hidden"]').each((_, el) => {
            ackData[$(el).attr('name')] = $(el).val();
        });
        ackData['ocbAcknowledgement'] = 'on';
        ackData['obtnAcknowledgeAndProceed'] = 'Acknowledge and Proceed';

        res = await client.post(reportCardUrl, qs.stringify(ackData), {
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded', 
                'Referer': reportCardUrl 
            }
        });
        $ = cheerio.load(res.data);
        console.log('Acknowledgement Submitted.');
    }

    console.log('5. Final Page Analysis...');
    fs.writeFileSync('diag_result.html', res.data);
    console.log('Title:', $('title').text());
    
    const subjects = [];
    $('table tr').each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length >= 4) {
            const code = $(cells[0]).text().trim();
            const desc = $(cells[1]).text().trim();
            if (code && desc && !code.toLowerCase().includes('code')) {
                subjects.push({ code, desc, grade: $(cells[cells.length-2]).text().trim() });
            }
        }
    });

    console.log('Subjects Found:', subjects.length);
    if (subjects.length > 0) console.table(subjects.slice(0, 5));
}

diagnose();
