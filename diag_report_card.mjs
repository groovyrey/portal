import axios from 'axios';
import * as cheerio from 'cheerio';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import qs from 'querystring';
import fs from 'fs';

async function diagnose() {
    try {
        const jar = new CookieJar();
        const client = wrapper(axios.create({ jar, withCredentials: true }));
        const userId = '20241322';
        const password = '09129927548';
        
        const loginPageUrl = 'https://premium.schoolista.com/LCC/Student/Main.aspx?_sid=' + userId;
        const loginPostUrl = 'https://premium.schoolista.com/LCC/Student/LCC.Login.aspx';
        const reportCardUrl = 'https://premium.schoolista.com/LCC/Student/LCC.ReportCardHED.aspx?_sid=20241322&_pc=SY2024-2025-1';

        console.log('Logging in...');
        const initRes = await client.get(loginPageUrl);
        const $init = cheerio.load(initRes.data);
        
        const formData = {};
        $init('input[type="hidden"]').each((_, el) => {
            formData[$init(el).attr('name')] = $init(el).val();
        });
        formData.otbUserID = userId;
        formData.otbPassword = password;
        formData.obtnLogin = 'LOGIN';

        await client.post(loginPostUrl, qs.stringify(formData), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Referer': loginPageUrl }
        });

        console.log('Fetching Report Card...');
        const res = await client.get(reportCardUrl, {
            headers: { 'Referer': loginPageUrl }
        });
        
        fs.writeFileSync('portal-app/report_card_dump.html', res.data);
        const $ = cheerio.load(res.data);
        console.log('Final Page Title:', $('title').text());
        
        const snippet = $('body').text().replace(/\s+/g, ' ').substring(0, 2000);
        console.log('Snippet:', snippet);
    } catch (e) {
        console.error(e);
    }
}

diagnose();
