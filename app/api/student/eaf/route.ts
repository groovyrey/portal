import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import qs from 'querystring';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { decrypt } from '@/lib/auth';

export async function GET(req: NextRequest) {
    let debugLog = "";
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
        debugLog += `Step 1: Visiting ${baseUrl}\n`;
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
        debugLog += `Step 2: Logging in via ${loginUrl}\n`;

        const loginRes = await client.post(loginUrl, qs.stringify(formData), {
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded',
                'Referer': finalInitUrl
            },
        });
        debugLog += `Step 2 Status: ${loginRes.status}\n`;

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
        debugLog += `Step 3: Extracted Period Code: ${periodCode}\n`;

        // 5. Fetch EAF Raw Page
        const eafUrl = `https://premium.schoolista.com/LCC/Reports/Enrollment/LCC.EAF.aspx?_sid=${userId}&_pc=${periodCode}`;
        debugLog += `Step 4: Fetching EAF: ${eafUrl}\n`;
        const eafRes = await client.get(eafUrl, {
            headers: { 'Referer': loginRes.request.res.responseUrl || finalInitUrl }
        });

        let eafHtml = eafRes.data;
        debugLog += `Step 4 Status: ${eafRes.status}, Content Length: ${eafHtml.length}\n`;
        
        // 6. Parse Data for Display
        const $eaf = cheerio.load(eafHtml);
        const extractedData: any = {
            profile: {},
            schedule: [],
            assessment: [],
            installments: []
        };

        // Extract Profile
        extractedData.profile = {
            name: $eaf('#fldName').text().trim(),
            studentId: $eaf('#fldStuID').text().trim(),
            course: $eaf('#fldCourseDesc').text().trim(),
            yearLevel: $eaf('#fldLevelDesc').text().trim(),
            section: $eaf('#fldSecCode').text().trim(),
            status: $eaf('#fldPrdStat').text().trim(),
            enrollmentDate: $eaf('#fldEnrolDate').text().trim(),
            address: `${$eaf('#fldAddress').text().trim()}, ${$eaf('#fldBrgy').text().trim()}, ${$eaf('#fldCity').text().trim()}`,
            mobile: $eaf('#fldMobile').text().trim(),
            email: $eaf('#fldEMail').text().trim(),
            gender: $eaf('#fldGender').text().trim(),
            nationality: $eaf('#fldNationality').text().trim(),
            civilStatus: $eaf('#fldMStat').text().trim(),
            totalUnits: $eaf('#fldTUnits').text().trim(),
            period: $eaf('#fldPrdDesc').text().trim()
        };

        // Extract Summary Totals
        extractedData.totals = {
            assessment: $eaf('#fldAssessmentTotal').text().trim(),
            balance: $eaf('#fldAssessmentBalance').text().trim(),
            netTotal: $eaf('#fldNetTotal').text().trim(),
            netBalance: $eaf('#fldNetBalance').text().trim(),
            dueToday: $eaf('#fldNetDueBalance').text().trim()
        };

        // Extract Schedule
        $eaf('#otbEnrollmentTable tr').each((i, row) => {
            if (i === 0) return; // Skip header
            const cells = $eaf(row).find('td');
            if (cells.length >= 6) {
                const units = $eaf(cells[3]).text().trim();
                if (!isNaN(parseFloat(units))) {
                    extractedData.schedule.push({
                        code: $eaf(cells[0]).text().trim(),
                        description: $eaf(cells[1]).text().trim(),
                        section: $eaf(cells[2]).text().trim(),
                        units: units,
                        schedule: $eaf(cells[4]).text().trim(),
                        room: $eaf(cells[5]).text().trim()
                    });
                }
            }
        });

        // Extract Assessment
        $eaf('#otbAssessmentDetailsTable tr').each((i, row) => {
            const cells = $eaf(row).find('td');
            if (cells.length === 2 && !$eaf(row).find('.GroupHeaderText').length) {
                const desc = $eaf(cells[0]).text().trim();
                const amount = $eaf(cells[1]).text().trim();
                if (desc && amount) {
                    extractedData.assessment.push({ description: desc, amount });
                }
            }
        });

        // Extract Installments
        $eaf('#otbAssessmentAdjustmentDueSummaryTable tr').each((i, row) => {
            if (i === 0) return;
            const cells = $eaf(row).find('td');
            if (cells.length === 4) {
                extractedData.installments.push({
                    dueDate: $eaf(cells[0]).text().trim(),
                    description: $eaf(cells[1]).text().trim(),
                    assessed: $eaf(cells[2]).text().trim(),
                    outstanding: $eaf(cells[3]).text().trim()
                });
            }
        });

        debugLog += `\n--- RAW SCRAPED CONTENT ---\n${eafHtml}\n`;

        // Inject <base> tag to automatically fix all relative URLs (CSS, JS, Images)
        const portalBase = 'https://premium.schoolista.com/LCC/Reports/Enrollment/';
        eafHtml = eafHtml.replace('<HEAD>', `<HEAD><base href="${portalBase}">`);

        return NextResponse.json({ 
            success: true, 
            html: eafHtml,
            url: eafUrl,
            data: extractedData,
            debugLog
        });

    } catch (error: any) {
        debugLog += `ERROR: ${error.message}\n`;
        console.error('EAF Scraping error:', error.message);
        return NextResponse.json({ 
            error: 'Failed to fetch EAF from school server.',
            debugLog 
        }, { status: 500 });
    }
}
