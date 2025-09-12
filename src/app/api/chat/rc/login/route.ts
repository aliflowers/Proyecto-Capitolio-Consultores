import { NextResponse } from 'next/server';

// Obsoleto: este endpoint ya no construye una URL con resumeToken.
// Se mantiene temporalmente para no romper clientes; redirige a la nueva ruta o informa.
export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'Este endpoint ha sido reemplazado por /api/rc/sso y el nuevo flujo de Iframe Auth. Visita /private/chat nuevamente.'
  }, { status: 410 });
}
