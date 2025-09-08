// Chat configuration constants
export const CHAT_CONFIG = {
  MAX_CONTEXT_LENGTH: 4000,
  MIN_SIMILARITY_THRESHOLD: 0.7,
  MAX_MATCHES: 5,
  DEFAULT_MODEL: 'gemini-1.5-flash',
  EMBEDDING_MODEL: 'text-embedding-004',
  TEMPERATURE: 0.7,
  MAX_TOKENS: 1000,
  ERROR_MESSAGES: {
    UNAUTHORIZED: 'No autorizado para acceder al chat',
    INTERNAL_ERROR: 'Error interno del servidor',
    NO_CONTEXT_FOUND: 'No se encontró contexto relevante para la pregunta',
    MODEL_ERROR: 'Error al generar la respuesta del modelo',
  }
} as const;

// System prompt template
export const SYSTEM_PROMPT_TEMPLATE = `
Eres un asistente de investigación jurídica altamente inteligente para la firma Capitolio Consultores.
Tu tarea es responder a las preguntas del usuario basándote ESTRICTAMENTE en el contexto proporcionado.
Si la respuesta no se encuentra en el contexto, indica claramente que no tienes información al respecto en los documentos proporcionados.
Cita tus fuentes refiriéndote a los fragmentos de texto relevantes.

Contexto:
{context}

Pregunta:
{question}

Respuesta:
`;
