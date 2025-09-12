'use client';

import RocketChatIframe from '@/components/private/RocketChatIframe';

export default function ChatPage() {
  return (
    <div className="w-full h-[calc(100vh-10rem)] p-0 m-0">
      <h1 className="sr-only">Chat interno</h1>
      <RocketChatIframe channel="general" />
    </div>
  );
}
