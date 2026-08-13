import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { decrypt } from '@/lib/auth';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_SIZE = 4 * 1024 * 1024; // 4MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function getSessionUserId(req: NextRequest): string | null {
  const sessionCookie = req.cookies.get('session_token');
  if (!sessionCookie?.value) return null;

  try {
    const decrypted = decrypt(sessionCookie.value);
    const sessionData = JSON.parse(decrypted);
    return sessionData.userId || null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({ error: 'Image hosting is not configured' }, { status: 503 });
    }

    const userId = getSessionUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, WebP, or GIF images are allowed' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Image must be 4MB or smaller' }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const safePublicId = `avatars/${userId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

    const result = await new Promise<{ secure_url?: string } | undefined>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id: safePublicId,
          overwrite: true,
          resource_type: 'image',
        },
        (error, uploadResult) => {
          if (error) reject(error);
          else resolve(uploadResult);
        }
      );
      stream.end(bytes);
    });

    if (!result || !result.secure_url) {
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, url: result.secure_url });
  } catch (error: unknown) {
    console.error('Cloudinary upload error:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
