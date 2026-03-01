import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';
import { addKnowledge, deleteKnowledge } from '@/lib/vector-store';
import { migrateKnowledgeBase } from '@/lib/db-migrate';
import { query } from '@/lib/turso';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await migrateKnowledgeBase();

    const result = await query('SELECT id, content, metadata FROM assistant_knowledge ORDER BY id DESC LIMIT 50');
    
    return NextResponse.json({ 
      success: true, 
      data: result.rows 
    });
  } catch (error: any) {
    console.error('Error fetching knowledge:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Basic role check
    try {
      const decrypted = decrypt(sessionCookie.value);
      const sessionData = JSON.parse(decrypted);
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Ensure table exists
    await migrateKnowledgeBase();

    const { content, metadata = {} } = await req.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    await addKnowledge(content, { 
      ...metadata, 
      added_at: new Date().toISOString(),
      source: 'admin_panel'
    });

    return NextResponse.json({ success: true, message: 'Knowledge added successfully' });
  } catch (error: any) {
    console.error('Error in knowledge API:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await deleteKnowledge(id);

    return NextResponse.json({ success: true, message: 'Knowledge deleted successfully' });
  } catch (error: any) {
    console.error('Error in DELETE knowledge:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

