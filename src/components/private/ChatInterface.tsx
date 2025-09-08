'use client'

import { useChat } from '@ai-sdk/react'
import { useState, useRef, useEffect } from 'react'

export default function ChatInterface() {
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, []);

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/chat',
    onResponse: () => {
      setIsLoading(false);
      setTimeout(scrollToBottom, 100);
    },
    onError: (error: Error) => {
      console.error('Chat error:', error);
      setIsLoading(false);
    }
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input?.trim()) return; // Usar encadenamiento opcional
    setIsLoading(true);
    handleSubmit(e);
  };

  return (
    <div className="flex flex-col w-full h-[calc(100vh-8rem)] max-w-3xl mx-auto bg-white rounded-md shadow-xl">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length > 0 ? (
          <>
            {messages.map((m: any) => (
              <div key={m.id} className={`whitespace-pre-wrap ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block p-3 rounded-lg ${m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                  <strong>{m.role === 'user' ? 'Tú' : 'Asistente'}:</strong> {m.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="text-center text-gray-500 flex items-center justify-center h-full">
            <div>
              <p className="mb-4">Pregúntale cualquier cosa a tu asistente de investigación.</p>
              <p className="text-sm text-gray-400">Escribe tu pregunta sobre los documentos legales...</p>
            </div>
          </div>
        )}
      </div>

      <div className="border-t p-4 bg-gray-50">
        <form onSubmit={onSubmit} className="flex items-center space-x-2">
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={input}
            placeholder="Escribe tu pregunta sobre los documentos..."
            onChange={handleInputChange}
            disabled={isLoading}
          />
          <button 
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-400 hover:bg-indigo-700 transition-colors"
            disabled={!input?.trim() || isLoading} // Usar encadenamiento opcional
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enviando...
              </span>
            ) : 'Enviar'}
          </button>
        </form>
      </div>
    </div>
  )
}
