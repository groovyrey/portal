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

        const { client, jar, consecutiveFailures } = await getSessionClient(userId);
        const scraper = new ScraperService(client, userId);

        const dashboardRes = await scraper.fetchDashboard();
        let $dashboard = dashboardRes.$;
        
        const hasLoginButton = $dashboard('input[name="obtnLogin"], #obtnLogin, input[value="LOGIN"]').length > 0;
        if (hasLoginButton) {
            const sessionCookie = req.cookies.get('session_token');
            if (sessionCookie?.value) {
                const decrypted = decrypt(sessionCookie.value);
                const { password } = JSON.parse(decrypted);
                
                if (password && (consecutiveFailures || 0) < 3) {
                    console.log(`[EAF] Session expired, re-logging in for ${userId}...`);
                    const loginRes = await scraper.forceLogin(password);
                    const stillHasLogin = loginRes.$('input[name="obtnLogin"], #obtnLogin, input[value="LOGIN"]').length > 0;
                    const { saveSession } = await import('@/lib/session-proxy');
                    await saveSession(userId, jar, !stillHasLogin);
                    
                    if (stillHasLogin) {
                        return NextResponse.json({ error: 'Portal session expired and auto-login failed.' }, { status: 401 });
                    }
                } else {
                    return NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 });
                }
            }
        }

        const { periodCode } = await scraper.fetchDashboard();
        const eafRes = await scraper.fetchEAF(periodCode);

        let eafHtml = eafRes.data;
        const $eaf = eafRes.$;

        // Parse Data using the enhanced ScraperService
        const studentInfo = await scraper.parseStudentInfo($eaf, $eaf, eafHtml, eafHtml); 
        const schedule = await scraper.parseSchedule($eaf, eafHtml);
        const financials = await scraper.parseFinancials($eaf, eafHtml);

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
