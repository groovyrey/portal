import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';
import { getSessionClient, saveSession } from '@/lib/session-proxy';
import { ScraperService } from '@/lib/scraper-service';

export async function POST(req: NextRequest) {
    try {
        const { currentPassword, newPassword } = await req.json();
        
        const sessionCookie = req.cookies.get('session_token');
        if (!sessionCookie || !sessionCookie.value) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        let userId = "";
        let savedPassword = "";
        try {
            const decrypted = decrypt(sessionCookie.value);
            const sessionData = JSON.parse(decrypted);
            userId = sessionData.userId;
            savedPassword = sessionData.password;
        } catch (e) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        const { client, jar, isNew } = await getSessionClient(userId);
        const scraper = new ScraperService(client, userId);

        // Ensure session is established
        if (isNew) {
            await scraper.forceLogin(savedPassword);
            await saveSession(userId, jar);
        }

        const result = await scraper.changePassword(currentPassword, newPassword);
        const rawHtml = result.data;
        const $result = result.$;
        const finalUrl = result.finalUrl;

        const errorText = $result('#lblError, #lblMessage, .text-danger, .error-message, .ErrorMessageText').text().trim();
        const successText = $result('.text-success, #lblSuccess, #lblMessage, .success-message').text().trim();

        console.log('Change Password Debug:', {
            finalUrl,
            errorText,
            successText,
            hasSuccessKeywords: rawHtml.toLowerCase().includes('successfully changed') || rawHtml.toLowerCase().includes('password changed'),
            formIsGone: $result('#otbPasswordChangeTable_1').length === 0
        });

        const hasSuccessText = 
            rawHtml.toLowerCase().includes('successfully changed') || 
            rawHtml.toLowerCase().includes('password changed') || 
            rawHtml.includes('Success') || 
            (successText && !errorText && !rawHtml.includes('otbPasswordChangeTable_1'));

        const redirectedToLogin = finalUrl.toLowerCase().includes('login.aspx') || rawHtml.includes('otbUserID');
        const redirectedToMain = finalUrl.toLowerCase().includes('main.aspx') || rawHtml.includes('otbMainTable') || rawHtml.includes('id="otbMain"');
        const formIsGone = $result('#otbPasswordChangeTable_1').length === 0;

        if (hasSuccessText || (redirectedToLogin && formIsGone) || (redirectedToMain && formIsGone)) {
            const response = NextResponse.json({ 
                success: true, 
                message: 'Password changed successfully. Please log in again.'
            });

            response.cookies.set('session_token', '', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 0,
                path: '/',
            });

            return response;
        }

        return NextResponse.json({ 
            success: false, 
            error: errorText || 'Failed to change password. Please verify your current password.',
            _debug_html: rawHtml
        }, { status: 400 });

    } catch (error: any) {
        console.error('Change password error:', error.message);
        return NextResponse.json({ error: 'Server error during password change.' }, { status: 500 });
    }
}
