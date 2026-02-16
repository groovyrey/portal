import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import qs from 'querystring';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { decrypt } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const { currentPassword, newPassword } = await req.json();
        
        // 1. Get credentials from session cookie
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

        const jar = new CookieJar();
        const client = wrapper(axios.create({ 
            jar, 
            withCredentials: true,
            maxRedirects: 5,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            }
        }));

        // 2. Login to establish session (required before accessing ChangePassword.aspx)
        const loginBaseUrl = `https://premium.schoolista.com/LCC/Student/Main.aspx?_sid=${userId}`;
        const initRes = await client.get(loginBaseUrl);
        const $init = cheerio.load(initRes.data);
        
        const loginFormData: any = {};
        $init('input[type="hidden"]').each((_, el) => {
            const name = $init(el).attr('name');
            if (name) loginFormData[name] = $init(el).val() || '';
        });
        loginFormData.otbUserID = userId;
        loginFormData.otbPassword = savedPassword; // Use current session password to login
        loginFormData.obtnLogin = 'LOGIN';

        const loginAction = $init('#Login').attr('action') || $init('form').first().attr('action') || './LCC.Login.aspx';
        const loginUrl = new URL(loginAction, initRes.request.res.responseUrl || loginBaseUrl).toString();

        await client.post(loginUrl, qs.stringify(loginFormData), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        // 3. Navigate to Change Password Page
        const changePassUrl = 'https://premium.schoolista.com/LCC/User/ChangePassword.aspx';
        const pageRes = await client.get(changePassUrl);
        const $page = cheerio.load(pageRes.data);

        // 4. Prepare the change password POST data
        const formData: any = {};
        $page('input[type="hidden"]').each((_, el) => {
            const name = $page(el).attr('name');
            if (name) formData[name] = $page(el).val() || '';
        });

        // Schoolista common field names for password change
        formData.otbOldPassword = currentPassword;
        formData.otbNewPassword = newPassword;
        formData.otbConfirmPassword = newPassword;
        formData.obtnSave = 'SAVE';

        // 5. Submit the change
        const action = $page('form').first().attr('action') || 'ChangePassword.aspx';
        const postUrl = new URL(action, changePassUrl).toString();

        const resultRes = await client.post(postUrl, qs.stringify(formData), {
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded',
                'Referer': changePassUrl
            }
        });

        const rawHtml = resultRes.data;
        const $result = cheerio.load(rawHtml);
        const errorText = $result('#lblError, #lblMessage, .text-danger').text().trim();
        const successText = $result('.text-success, #lblSuccess').text().trim();

        if (rawHtml.includes('successfully changed') || rawHtml.includes('Success') || successText) {
            return NextResponse.json({ 
                success: true, 
                message: 'Password changed successfully.',
                debugHtml: rawHtml
            });
        }

        return NextResponse.json({ 
            success: false, 
            error: errorText || 'Failed to change password. Please verify your current password.',
            debugHtml: rawHtml
        }, { status: 400 });

    } catch (error: any) {
        console.error('Change password error:', error.message);
        return NextResponse.json({ error: 'Server error during password change.' }, { status: 500 });
    }
}
