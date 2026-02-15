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
    const loginRes = await client.post(loginPostUrl, qs.stringify(formData), {
        headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': loginPageUrl
        }
    });

    console.log('3. Fetching Subject List...');
    // We must use the SAME client to keep the cookies
    const subjectListRes = await client.get(subjectListUrl, {
        headers: { 'Referer': loginPageUrl }
    });
    
    fs.writeFileSync('portal-app/subject_list_dump.html', subjectListRes.data);
    
    const $ = cheerio.load(subjectListRes.data);
    const title = $('title').text();
    console.log('Final Page Title:', title);
    
    if (subjectListRes.data.includes('Subject') || subjectListRes.data.includes('Code')) {
        console.log('SUCCESS: Subject list data found in HTML!');
    } else {
        console.log('FAILURE: Still seeing the login/error page.');
    }
}

diagnose();
