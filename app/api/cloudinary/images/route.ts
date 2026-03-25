import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const folder = searchParams.get('folder');

  if (!folder || (folder !== 'mobile' && folder !== 'desktop')) {
    return NextResponse.json([]);
  }

  try {
    // Using Cloudinary Search API for absolute precision.
    // This looks for "Asset Folder" metadata, which matches the UI organization.
    const result = await cloudinary.search
      .expression(`folder:${folder}`)
      .sort_by('public_id', 'desc')
      .max_results(50)
      .execute();

    // Mapping search results to match the structure the UI expects
    // search result returns resources in an array, and each resource uses secure_url
    return NextResponse.json(result.resources);
    
  } catch (error: any) {
    console.error('Cloudinary Search error:', error);
    return NextResponse.json([]);
  }
}
