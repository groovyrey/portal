import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';
import { getSessionClient } from '@/lib/session-proxy';
import { ScraperService } from '@/lib/scraper-service';

export async function GET(req: NextRequest) {
    try {
        const sessionCookie = req.cookies.get('session_token');
        if (!sessionCookie || !sessionCookie.value) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        let userId = "";
        try {
            const decrypted = decrypt(sessionCookie.value);
            const sessionData = JSON.parse(decrypted);
            userId = sessionData.userId;
        } catch (e) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        const { client } = await getSessionClient(userId);
        const scraper = new ScraperService(client, userId);

        const { periodCode } = await scraper.fetchDashboard();
        const eafRes = await scraper.fetchEAF(periodCode);

        let eafHtml = eafRes.data;
        const $eaf = eafRes.$;

        // Parse Data using the enhanced ScraperService
        const studentInfo = scraper.parseStudentInfo($eaf, $eaf); // Using EAF for both for comprehensive info
        const schedule = scraper.parseSchedule($eaf);
        const financials = scraper.parseFinancials($eaf);

        const extractedData = {
            profile: {
                ...studentInfo,
                studentId: studentInfo.studentId || userId,
            },
            schedule: schedule.map(item => ({
                code: item.subject,
                description: item.description,
                section: item.section,
                units: item.units,
                schedule: item.time,
                room: item.room
            })),
            assessment: financials.assessment,
            installments: financials.installments,
            totals: {
                assessment: financials.total,
                balance: financials.balance,
                netTotal: financials.netTotal,
                netBalance: financials.netBalance,
                dueToday: financials.dueToday
            }
        };

        // Inject <base> tag to automatically fix all relative URLs
        const portalBase = 'https://premium.schoolista.com/LCC/Reports/Enrollment/';
        if (eafHtml.includes('<HEAD>')) {
            eafHtml = eafHtml.replace('<HEAD>', `<HEAD><base href="${portalBase}">`);
        } else if (eafHtml.includes('<head>')) {
            eafHtml = eafHtml.replace('<head>', `<head><base href="${portalBase}">`);
        }

        return NextResponse.json({ 
            success: true, 
            html: eafHtml,
            url: `https://premium.schoolista.com/LCC/Reports/Enrollment/LCC.EAF.aspx?_sid=${userId}&_pc=${periodCode}`,
            data: extractedData
        });

    } catch (error: any) {
        console.error('EAF Scraping error:', error.message);
        return NextResponse.json({ 
            error: 'Failed to fetch EAF from school server.'
        }, { status: 500 });
    }
}
