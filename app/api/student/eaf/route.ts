import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import qs from 'querystring';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { decrypt } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        // 1. Get credentials from session cookie
        const sessionCookie = req.cookies.get('session_token');
        if (!sessionCookie || !sessionCookie.value) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        let userId = "";
        let password = "";
        try {
            const decrypted = decrypt(sessionCookie.value);
            const sessionData = JSON.parse(decrypted);
            userId = sessionData.userId;
            password = sessionData.password;
        } catch (e) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        const jar = new CookieJar();
        const client = wrapper(axios.create({ 
            jar, 
            withCredentials: true,
            maxRedirects: 5,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            }
        }));

        // 2. Initial visit to get session tokens
        const baseUrl = `https://premium.schoolista.com/LCC/Student/Main.aspx?_sid=${userId}`;
        const initRes = await client.get(baseUrl);
        const finalInitUrl = initRes.request.res.responseUrl || baseUrl;
        const $init = cheerio.load(initRes.data);

        // 3. Login
        const formData: any = {};
        $init('input[type="hidden"]').each((_, el) => {
            const name = $init(el).attr('name');
            if (name) formData[name] = $init(el).val() || '';
        });
        formData.otbUserID = userId;
        formData.otbPassword = password;
        formData.obtnLogin = 'LOGIN';

        const loginAction = $init('#Login').attr('action') || $init('form').first().attr('action') || './LCC.Login.aspx';
        const loginUrl = new URL(loginAction, finalInitUrl).toString();

        const loginRes = await client.post(loginUrl, qs.stringify(formData), {
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded',
                'Referer': finalInitUrl
            },
        });

        // 4. Extract Period Code (_pc) from dashboard
        const $dashboard = cheerio.load(loginRes.data);
        let periodCode = "SY2025-2026-2"; // Fallback
        $dashboard('a').each((_, el) => {
            const href = $dashboard(el).attr('href');
            if (href && href.includes('_pc=')) {
                const match = href.match(/_pc=([^&]+)/);
                if (match) {
                    periodCode = match[1];
                    return false;
                }
            }
        });

        // 5. Fetch EAF Raw Page
        const eafUrl = `https://premium.schoolista.com/LCC/Reports/Enrollment/LCC.EAF.aspx?_sid=${userId}&_pc=${periodCode}`;
        const eafRes = await client.get(eafUrl, {
            headers: { 'Referer': loginRes.request.res.responseUrl || finalInitUrl }
        });

        let eafHtml = eafRes.data;

        // Fix Relative URLs for CSS, JS, and Images to preserve official layout
        const portalBase = 'https://premium.schoolista.com/LCC/Reports/Enrollment/';
        const portalRoot = 'https://premium.schoolista.com';

        // Replace relative paths starting with ../.. or / with absolute portal URLs
        eafHtml = eafHtml.replace(/href="\.\.\/\.\.\//g, `href="${portalRoot}/`);
        eafHtml = eafHtml.replace(/src="\.\.\/\.\.\//g, `src="${portalRoot}/`);
        eafHtml = eafHtml.replace(/href="\//g, `href="${portalRoot}/`);
        eafHtml = eafHtml.replace(/src="\//g, `src="${portalRoot}/`);

        return NextResponse.json({ 
            success: true, 
            html: eafHtml,
            url: eafUrl
        });

    } catch (error: any) {
        console.error('EAF Scraping error:', error.message);
        return NextResponse.json({ error: 'Failed to fetch EAF from school server.' }, { status: 500 });
    }
}
