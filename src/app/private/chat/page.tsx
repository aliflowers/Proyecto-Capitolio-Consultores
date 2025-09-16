'use client';

// Usando el componente simplificado que evita loops infinitos
import RocketChatSimple from '@/components/private/RocketChatSimple';
// import RocketChatIframe from '@/components/private/RocketChatIframe'; // Componente anterior con problemas de loop

export default function ChatPage() {
  return (
    <div className="w-full h-[calc(100vh-10rem)] p-0 m-0">
      <h1 className="sr-only">Chat interno</h1>
      <RocketChatSimple channel="general" />
    </div>
  );
}
