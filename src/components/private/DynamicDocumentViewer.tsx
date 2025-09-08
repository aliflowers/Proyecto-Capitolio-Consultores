'use client';

import dynamic from 'next/dynamic';

const DocumentViewerClient = dynamic(() => import('@/components/private/DocumentViewerClient'), { 
  ssr: false,
  loading: () => <p>Cargando visor de documentos...</p>
});

export default function DynamicDocumentViewer({ document }: { document: any }) {
  return <DocumentViewerClient document={document} />;
}
