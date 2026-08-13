import { NextResponse } from 'next/server';
import { FALLBACK_ANDROID_APP_URL, FALLBACK_ANDROID_APP_VERSION } from '@/lib/app-release';

export const revalidate = 3600;

export async function GET() {
  try {
    const res = await fetch('https://api.github.com/repos/groovyrey/lcchub/releases/latest', {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error('GitHub API error');
    const data = await res.json();
    const apk = data.assets?.find((a: { name?: string }) => a.name?.endsWith('.apk'));
    const version = String(data.tag_name || '').replace(/^v/, '');
    if (!apk?.browser_download_url) throw new Error('No APK asset');
    return NextResponse.json({ version, downloadUrl: apk.browser_download_url });
  } catch {
    return NextResponse.json({
      version: FALLBACK_ANDROID_APP_VERSION,
      downloadUrl: FALLBACK_ANDROID_APP_URL,
    });
  }
}
