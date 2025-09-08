import { genAI } from './ai';

// Utility function to convert Gemini stream to readable stream
export async function* convertGeminiStreamToTextStream(geminiStream: AsyncIterable<any>) {
  for await (const chunk of geminiStream) {
    const text = chunk.text();
    if (text) {
      yield text;
    }
  }
}

// Utility function to create a proper text stream response
export function createChatResponse(stream: ReadableStream<Uint8Array>) {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Utility function to get embeddings for a query
export async function getQueryEmbedding(query: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(query);
    return result.embedding.values;
  } catch (error) {
    console.error('Error getting query embedding:', error);
    throw error;
  }
}
