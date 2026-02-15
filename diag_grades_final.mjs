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
    
    const baseUrl = 'https://premium.schoolista.com/LCC/Student/Main.aspx?_sid=' + userId;
    const gradesUrl = 'https://premium.schoolista.com/LCC/Student/Main.aspx?_sid=' + userId + '&_pc=SY2025-2026-2&_dm=Grades&_nm=';
    const loginUrl = 'https://premium.schoolista.com/LCC/Student/LCC.Login.aspx';

    // Login first
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
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Referer': baseUrl }
    });

    // Fetch Grades
    const gradesRes = await client.get(gradesUrl, { headers: { 'Referer': baseUrl } });
    const $ = cheerio.load(gradesRes.data);
    
    console.log('Page Title:', $('title').text());
    const snippet = $('body').text().replace(/\s+/g, ' ').substring(0, 2000);
    console.log('Content:', snippet);
}

diagnose();
