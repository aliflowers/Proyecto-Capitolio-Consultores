import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { protectApiRoute } from '@/lib/server-auth';

// GET - Obtener todos los documentos (protegido y con filtros)
export async function GET(request: Request) {
  try {
    const authResult = await protectApiRoute();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const filters = {
      name: searchParams.get('name'),
      document_type: searchParams.get('document_type'),
      date_from: searchParams.get('date_from'),
      date_to: searchParams.get('date_to'),
      expediente_id: searchParams.get('expediente_id'),
      client_id: searchParams.get('client_id'),
    };

    let queryText = `
      SELECT 
        d.id, d.user_id, d.name, d.path, d.mime_type, d.document_type, d.client_id,
        d.created_at, u.email as created_by_email, p.full_name as created_by_name,
        cs.expediente_name,
        COALESCE(cl_direct.full_name, cl_indirect.full_name) as client_name
      FROM documentos d
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN profiles p ON d.user_id = p.id
      LEFT JOIN clientes cl_direct ON d.client_id = cl_direct.id
      LEFT JOIN expedientes_documentos ed ON d.id = ed.documento_id
      LEFT JOIN expedientes cs ON ed.expediente_id = cs.id
      LEFT JOIN expedientes_clientes ec ON cs.id = ec.expediente_id
      LEFT JOIN clientes cl_indirect ON ec.cliente_id = cl_indirect.id
    `;

    const whereClauses: string[] = ['d.user_id = $1'];
    const queryParams: any[] = [user.id];
    let paramIndex = 1;

    if (filters.name) {
      paramIndex++;
      queryParams.push(`%${filters.name}%`);
      whereClauses.push(`d.name ILIKE $${paramIndex}`);
    }
    if (filters.document_type) {
      paramIndex++;
      queryParams.push(filters.document_type);
      whereClauses.push(`d.document_type = $${paramIndex}`);
    }
    if (filters.date_from) {
      paramIndex++;
      queryParams.push(filters.date_from);
      whereClauses.push(`d.created_at >= $${paramIndex}`);
    }
    if (filters.date_to) {
      paramIndex++;
      queryParams.push(filters.date_to);
      whereClauses.push(`d.created_at <= $${paramIndex}`);
    }
    if (filters.client_id) {
      paramIndex++;
      queryParams.push(filters.client_id);
      whereClauses.push(`(d.client_id = $${paramIndex} OR cl_indirect.id = $${paramIndex})`);
    }
    if (filters.expediente_id) {
      paramIndex++;
      queryParams.push(filters.expediente_id);
      whereClauses.push(`cs.id = $${paramIndex}`);
    }

    if (whereClauses.length > 0) {
      queryText += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    queryText += ` GROUP BY d.id, u.email, p.full_name, cs.expediente_name, cl_direct.full_name, cl_indirect.full_name ORDER BY d.created_at DESC`;

    const result = await query(queryText, queryParams);
    
    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
    
  } catch (error) {
    console.error('Error al obtener documentos:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al obtener documentos',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo documento (protegido)
export async function POST(request: Request) {
  try {
    const authResult = await protectApiRoute();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { name, path, mime_type, document_type, client_id } = body; // Añadir client_id
    const { user } = authResult;
    
    // Validar datos requeridos
    if (!name || !path) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Nombre y ruta son requeridos' 
        },
        { status: 400 }
      );
    }
    
    // Validar formato MIME type si se proporciona
    if (mime_type) {
      const mimeTypeRegex = /^[a-z]+\/[a-z0-9\.\-\+]+$/i;
      if (!mimeTypeRegex.test(mime_type)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Formato de MIME type inválido' 
          },
          { status: 400 }
        );
      }
    }
    
    // Insertar documento
    const result = await query(`
      INSERT INTO documentos (
        user_id,
        name,
        path,
        mime_type,
        document_type,
        client_id, -- Añadido
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id, user_id, name, path, mime_type, document_type, client_id, created_at
    `, [user.id, name, path, mime_type, document_type, client_id]);
    
    return NextResponse.json({
      success: true,
      message: 'Documento creado exitosamente',
      data: result.rows[0]
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error al crear documento:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al crear documento',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// PUT - Actualizar documento (protegido)
export async function PUT(request: Request) {
  try {
    const authResult = await protectApiRoute();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { id, name, path, mime_type, document_type, client_id } = body; // Añadir client_id
    
    // Validar ID requerido
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID de documento es requerido' 
        },
        { status: 400 }
      );
    }
    
    // Validar formato MIME type si se proporciona
    if (mime_type) {
      const mimeTypeRegex = /^[a-z]+\/[a-z0-9\.\-\+]+$/i;
      if (!mimeTypeRegex.test(mime_type)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Formato de MIME type inválido' 
          },
          { status: 400 }
        );
      }
    }
    
    // Actualizar documento
    const result = await query(`
      UPDATE documentos 
      SET 
        name = COALESCE($1, name),
        path = COALESCE($2, path),
        mime_type = COALESCE($3, mime_type),
        document_type = COALESCE($4, document_type),
        client_id = COALESCE($5, client_id) -- Añadido
      WHERE id = $6
      RETURNING id, user_id, name, path, mime_type, document_type, client_id, created_at
    `, [name, path, mime_type, document_type, client_id, id]);
    
    if (result.rowCount === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Documento no encontrado' 
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Documento actualizado exitosamente',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error al actualizar documento:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al actualizar documento',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar documento (protegido)
export async function DELETE(request: Request) {
  try {
    const authResult = await protectApiRoute();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    // Validar ID requerido
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID de documento es requerido' 
        },
        { status: 400 }
      );
    }
    
    // Eliminar relaciones primero (por clave foránea)
    await query('DELETE FROM document_chunks WHERE document_id = $1', [id]);
    await query('DELETE FROM expedientes_documentos WHERE documento_id = $1', [id]);
    
    // Eliminar documento
    const result = await query('DELETE FROM documentos WHERE id = $1 RETURNING id, name', [id]);
    
    if (result.rowCount === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Documento no encontrado' 
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Documento eliminado exitosamente',
      data: { 
        id: result.rows[0].id,
        name: result.rows[0].name
      }
    });
    
  } catch (error) {
    console.error('Error al eliminar documento:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al eliminar documento',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
