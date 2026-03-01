import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
  }

  try {
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=12&key=${apiKey}`
    );

    if (!searchResponse.ok) {
      const errorData = await searchResponse.json();
      console.error('YouTube API Error:', errorData);
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to fetch videos' }, 
        { status: searchResponse.status }
      );
    }

    const searchData = await searchResponse.json();
    const videoIds = searchData.items?.map((item: any) => item.id.videoId).filter(Boolean).join(',');

    if (!videoIds) {
      return NextResponse.json(searchData);
    }

    // Fetch full details for the searched videos
    const detailsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics,topicDetails&id=${videoIds}&key=${apiKey}`
    );

    if (!detailsResponse.ok) {
      return NextResponse.json(searchData);
    }

    const detailsData = await detailsResponse.json();

    // Map the details back to the search result structure but with full data
    const enhancedItems = searchData.items.map((item: any) => {
      const details = detailsData.items?.find((d: any) => d.id === item.id.videoId);
      return {
        ...item,
        snippet: details?.snippet || item.snippet,
        contentDetails: details?.contentDetails,
        statistics: details?.statistics,
        topicDetails: details?.topicDetails
      };
    });

    return NextResponse.json({ ...searchData, items: enhancedItems });
  } catch (error) {
    console.error('YouTube Proxy Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
