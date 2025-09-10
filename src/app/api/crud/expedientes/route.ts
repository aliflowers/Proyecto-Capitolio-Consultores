import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { protectApiRoute } from '@/lib/server-auth';

// GET - Obtener todos los expedientes (protegido y con filtros)
export async function GET(request: Request) {
  try {
    const authResult = await protectApiRoute();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const filters = {
      expediente_number: searchParams.get('expediente_number'),
      expediente_name: searchParams.get('expediente_name'),
      cliente_id: searchParams.get('cliente_id'),
      status: searchParams.get('status'),
    };

    let queryText = `
      SELECT 
        e.id,
        e.user_id,
        e.expediente_name,
        e.expediente_number,
        e.status,
        e.description,
        e.created_at,
        u.email as created_by_email,
        p.full_name as created_by_name,
        c.full_name as cliente_name
      FROM expedientes e
      LEFT JOIN users u ON e.user_id = u.id
      LEFT JOIN profiles p ON e.user_id = p.id
      LEFT JOIN expedientes_clientes ec ON e.id = ec.expediente_id
      LEFT JOIN clientes c ON ec.cliente_id = c.id
    `;

    const whereClauses: string[] = [];
    const queryParams: any[] = [];

    if (!user.is_super_admin) {
      whereClauses.push('(e.user_id = $1 OR EXISTS (SELECT 1 FROM resource_shares s WHERE s.resource_type = \'expediente\' AND s.resource_id = e.id AND s.target_user_id = $1))');
      queryParams.push(user.id);
    }

    if (filters.expediente_number) {
      queryParams.push(`%${filters.expediente_number}%`);
      whereClauses.push(`e.expediente_number ILIKE $${queryParams.length}`);
    }
    if (filters.expediente_name) {
      queryParams.push(`%${filters.expediente_name}%`);
      whereClauses.push(`e.expediente_name ILIKE $${queryParams.length}`);
    }
    if (filters.cliente_id) {
      queryParams.push(filters.cliente_id);
      whereClauses.push(`c.id = $${queryParams.length}`);
    }
    if (filters.status) {
      queryParams.push(filters.status);
      whereClauses.push(`e.status = $${queryParams.length}`);
    }

    if (whereClauses.length > 0) {
      queryText += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    queryText += ` ORDER BY e.created_at DESC`;

    const result = await query(queryText, queryParams);
    
    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
    
  } catch (error) {
    console.error('Error al obtener expedientes:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al obtener expedientes',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo expediente (protegido)
export async function POST(request: Request) {
  try {
    const authResult = await protectApiRoute();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const body = await request.json();
    const { expediente_name, status = 'abierto', description, cliente_id, documento_ids } = body;
    const { user } = authResult;
    
    if (!expediente_name || !cliente_id) {
      return NextResponse.json(
        { success: false, error: 'Nombre del expediente y cliente son requeridos' },
        { status: 400 }
      );
    }
    
    await query('BEGIN');

    const maxNumberResult = await query(`
      SELECT MAX(CAST(expediente_number AS INTEGER)) as max_number 
      FROM expedientes 
      WHERE user_id = $1
    `, [user.id]);
    
    const nextNumber = (maxNumberResult.rows[0].max_number || 0) + 1;
    const expediente_number = nextNumber.toString().padStart(6, '0');

    const expedienteResult = await query(`
      INSERT INTO expedientes (user_id, expediente_name, expediente_number, status, description, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) 
      RETURNING id
    `, [user.id, expediente_name, expediente_number, status, description]);
    
    const newExpedienteId = expedienteResult.rows[0].id;

    await query(`
      INSERT INTO expedientes_clientes (expediente_id, cliente_id) 
      VALUES ($1, $2)
    `, [newExpedienteId, cliente_id]);

    if (documento_ids && documento_ids.length > 0) {
      for (const documento_id of documento_ids) {
        await query(`
          INSERT INTO expedientes_documentos (expediente_id, documento_id) 
          VALUES ($1, $2)
        `, [newExpedienteId, documento_id]);
      }
    }

    await query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Expediente creado exitosamente',
      data: { id: newExpedienteId, expediente_number }
    }, { status: 201 });
    
  } catch (error) {
    await query('ROLLBACK');
    console.error('Error al crear expediente:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al crear expediente',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// PUT - Actualizar expediente (protegido)
export async function PUT(request: Request) {
  try {
    const authResult = await protectApiRoute();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { id, expediente_name, status, description } = body;
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de expediente es requerido' }, { status: 400 });
    }
    
    const result = await query(`
      UPDATE expedientes 
      SET 
        expediente_name = COALESCE($1, expediente_name),
        status = COALESCE($2, status),
        description = COALESCE($3, description),
        updated_at = NOW()
      WHERE id = $4 AND user_id = $5
      RETURNING *
    `, [expediente_name, status, description, id, authResult.user.id]);
    
    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Expediente no encontrado' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Expediente actualizado exitosamente',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error al actualizar expediente:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al actualizar expediente',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar expediente (protegido)
export async function DELETE(request: Request) {
  try {
    const authResult = await protectApiRoute();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de expediente es requerido' }, { status: 400 });
    }
    
    await query('BEGIN');
    // Restringir a dueño del expediente
    const ownerCheck = await query('SELECT user_id FROM expedientes WHERE id = $1', [id]);
    if (ownerCheck.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Expediente no encontrado' }, { status: 404 });
    }
    if (ownerCheck.rows[0].user_id !== (authResult as any).user.id) {
      return NextResponse.json({ success: false, error: 'No autorizado para eliminar este expediente' }, { status: 403 });
    }

    await query('DELETE FROM expedientes_documentos WHERE expediente_id = $1', [id]);
    await query('DELETE FROM expedientes_clientes WHERE expediente_id = $1', [id]);
    const result = await query('DELETE FROM expedientes WHERE id = $1 RETURNING id, expediente_name', [id]);
    await query('COMMIT');
    
    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Expediente no encontrado' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Expediente eliminado exitosamente',
      data: { id: result.rows[0].id, expediente_name: result.rows[0].expediente_name }
    });
    
  } catch (error) {
    await query('ROLLBACK');
    console.error('Error al eliminar expediente:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al eliminar expediente',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
