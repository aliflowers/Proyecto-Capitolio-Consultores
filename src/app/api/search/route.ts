import { getCurrentUser } from '@/lib/server-auth'
import { genAI } from '@/lib/ai'
import { query } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const { query: userQuery } = await req.json()

    if (!userQuery) {
      return new NextResponse(JSON.stringify({ error: 'Query is required' }), { status: 400 })
    }

    // 1. Generate embedding for the user's query
    const model = genAI.getGenerativeModel({ model: "text-embedding-004"});
    const result = await model.embedContent(userQuery);
    const embedding = result.embedding.values;

    // 2. Call the database function to find matching chunks
    const dbResult = await query(
      `SELECT * FROM match_document_chunks($1, $2, $3)`,
      [embedding, 0.7, 5]
    );

    const chunks = dbResult.rows;

    return NextResponse.json(chunks)

  } catch (error: any) {
    console.error('Search error:', error);
    return new NextResponse(JSON.stringify({ error: error.message || 'Internal server error' }), { status: 500 })
  }
}
