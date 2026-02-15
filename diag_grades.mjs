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
        
        const baseUrl = 'https://premium.schoolista.com/LCC/Student/Main.aspx?_sid=' + userId + '&_pc=SY2025-2026-2&_dm=Main&_nm=';
        const gradesUrl = 'https://premium.schoolista.com/LCC/Student/Main.aspx?_sid=' + userId + '&_pc=SY2025-2026-2&_dm=Grades&_nm=';
        const loginUrl = 'https://premium.schoolista.com/LCC/Student/LCC.Login.aspx';

        console.log('Logging in...');
        const initRes = await client.get(baseUrl);
        const $init = cheerio.load(initRes.data);
        const formData = {
            __VIEWSTATE: $init('#__VIEWSTATE').val(),
            __VIEWSTATEGENERATOR: $init('#__VIEWSTATEGENERATOR').val(),
            __EVENTVALIDATION: $init('#__EVENTVALIDATION').val(),
            otbUserID: userId,
            otbPassword: password,
            obtnLogin: 'LOGIN'
        };

        await client.post(loginUrl, qs.stringify(formData), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        console.log('Fetching Grades...');
        const gradesRes = await client.get(gradesUrl);
        
        fs.writeFileSync('portal-app/grades_dump.html', gradesRes.data);
        const $ = cheerio.load(gradesRes.data);
        console.log('Dump saved. Title:', $('title').text());
        
        const pageText = $('body').text().replace(/\s+/g, ' ');
        console.log('Snippet:', pageText.substring(0, 1000));
    } catch (e) {
        console.error(e);
    }
}

diagnose();
