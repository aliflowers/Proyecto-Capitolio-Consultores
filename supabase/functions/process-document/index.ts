import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai'
import pdf from 'https://esm.sh/pdf-parse@1.1.1'

// Simple text chunking function
function chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = i + chunkSize;
    chunks.push(text.substring(i, end));
    i += chunkSize - overlap;
  }
  return chunks;
}

serve(async (req) => {
  const { record: document } = await req.json()

  try {
    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Download the document from Storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('documentos')
      .download(document.path)

    if (downloadError) throw downloadError

    // 2. Extract text from the PDF
    const pdfData = await pdf(await fileData.arrayBuffer())
    const text = pdfData.text

    if (!text) {
      return new Response(JSON.stringify({ message: 'No text found in PDF' }), { status: 200 })
    }

    // 3. Chunk the text
    const chunks = chunkText(text)

    // 4. Initialize Google AI and generate embeddings
    const genAI = new GoogleGenerativeAI(Deno.env.get('GOOGLE_AI_API_KEY')!)
    const model = genAI.getGenerativeModel({ model: "text-embedding-004"});

    const embeddings = await Promise.all(chunks.map(async (chunk) => {
      const result = await model.embedContent(chunk);
      return result.embedding.values;
    }));

    // 5. Store chunks and embeddings in the database
    const chunkData = chunks.map((chunk, i) => ({
      document_id: document.id,
      user_id: document.user_id,
      content: chunk,
      embedding: embeddings[i],
    }))

    const { error: insertError } = await supabaseAdmin
      .from('document_chunks')
      .insert(chunkData)

    if (insertError) throw insertError

    return new Response(JSON.stringify({ message: `Successfully processed ${chunks.length} chunks.` }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
