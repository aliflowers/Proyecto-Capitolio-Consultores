import { getCurrentUser } from '@/lib/server-auth';
import { genAI } from '@/lib/ai';
import { query } from '@/lib/db';
import { getQueryEmbedding } from '@/lib/chat-utils';
import { CHAT_CONFIG, SYSTEM_PROMPT_TEMPLATE } from '@/lib/chat-config';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return new Response(JSON.stringify({ error: CHAT_CONFIG.ERROR_MESSAGES.UNAUTHORIZED }), { status: 401 });
    }

    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage.content;

    // 1. Get embeddings for the user's query
    const embedding = await getQueryEmbedding(userQuery);

    // 2. Find relevant document chunks using local database
    const dbResult = await query(
      `SELECT * FROM match_document_chunks($1, $2, $3)`,
      [embedding, CHAT_CONFIG.MIN_SIMILARITY_THRESHOLD, CHAT_CONFIG.MAX_MATCHES]
    );

    const chunks = dbResult.rows;
    const context = chunks.map((c: any) => c.content).join('\n\n---\n\n');

    // 3. Augment the prompt and generate a response
    const generativeModel = genAI.getGenerativeModel({ 
      model: CHAT_CONFIG.DEFAULT_MODEL,
      generationConfig: {
        temperature: CHAT_CONFIG.TEMPERATURE,
        maxOutputTokens: CHAT_CONFIG.MAX_TOKENS,
      }
    });

    const prompt = SYSTEM_PROMPT_TEMPLATE
      .replace('{context}', context)
      .replace('{question}', userQuery);

    const result = await generativeModel.generateContentStream(prompt);

    // 4. Convert the stream to a readable stream and send back to the client
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(new TextEncoder().encode(text));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || CHAT_CONFIG.ERROR_MESSAGES.INTERNAL_ERROR 
    }), { status: 500 });
  }
}
