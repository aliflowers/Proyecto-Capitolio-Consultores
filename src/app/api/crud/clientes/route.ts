import { NextResponse } from 'next/server';
import { query, withUserRLS } from '@/lib/db';
import { protectApiRoute } from '@/lib/server-auth';

// GET - Obtener todos los clientes (protegido y con filtros)
export async function GET(request: Request) {
  try {
    const authResult = await protectApiRoute();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const filters = {
      full_name: searchParams.get('full_name'),
      numero_documento: searchParams.get('numero_documento'),
      email: searchParams.get('email'),
      phone: searchParams.get('phone'),
      date_from: searchParams.get('date_from'),
      date_to: searchParams.get('date_to'),
    };

    let queryText = `
      SELECT 
        c.*,
        (
          SELECT ARRAY_AGG(e.expediente_number)
          FROM expedientes e
          JOIN expedientes_clientes ec ON e.id = ec.expediente_id
          WHERE ec.cliente_id = c.id
        ) as expedientes,
        (
          SELECT COUNT(DISTINCT doc.id)
          FROM documentos AS doc
          WHERE
            doc.client_id = c.id
            OR
            doc.id IN (
              SELECT ed.documento_id
              FROM expedientes_documentos AS ed
              JOIN expedientes_clientes AS ec ON ed.expediente_id = ec.expediente_id
              WHERE ec.cliente_id = c.id
            )
        ) as documentos_count
      FROM clientes c
    `;

    const whereClauses: string[] = [];
    const queryParams: any[] = [];

    if (!user.is_super_admin) {
      whereClauses.push('(c.user_id = $1 OR EXISTS (SELECT 1 FROM resource_shares s WHERE s.resource_type = \'cliente\' AND s.resource_id = c.id AND s.target_user_id = $1))');
      queryParams.push(user.id);
    }

    if (filters.full_name) {
      queryParams.push(`%${filters.full_name}%`);
      whereClauses.push(`c.full_name ILIKE $${queryParams.length}`);
    }
    if (filters.numero_documento) {
      queryParams.push(`%${filters.numero_documento}%`);
      whereClauses.push(`c.numero_documento ILIKE $${queryParams.length}`);
    }
    if (filters.email) {
      queryParams.push(`%${filters.email}%`);
      whereClauses.push(`c.email ILIKE $${queryParams.length}`);
    }
    if (filters.phone) {
      queryParams.push(`%${filters.phone}%`);
      whereClauses.push(`c.phone ILIKE $${queryParams.length}`);
    }
    if (filters.date_from) {
      queryParams.push(filters.date_from);
      whereClauses.push(`c.created_at >= $${queryParams.length}`);
    }
    if (filters.date_to) {
      queryParams.push(filters.date_to);
      whereClauses.push(`c.created_at <= $${queryParams.length}`);
    }

    if (whereClauses.length > 0) {
      queryText += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    queryText += ` GROUP BY c.id ORDER BY c.created_at DESC`;

    const result = await withUserRLS(user.id, async (client) => client.query(queryText, queryParams));
    
    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
    
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al obtener clientes',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo cliente (protegido)
export async function POST(request: Request) {
  try {
    const authResult = await protectApiRoute();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { full_name, email, phone, tipo_documento, numero_documento, nacionalidad, direccion } = body;
    const { user } = authResult;
    
    // Validar datos requeridos
    if (!full_name) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Nombre completo es requerido' 
        },
        { status: 400 }
      );
    }
    
    // Validar formato de email si se proporciona
    if (email) {
      const emailRegex = /^[^​-​]+@[^​-​]+\.[^​-​]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Formato de email inválido' 
          },
          { status: 400 }
        );
      }
    }
    
    // Validar formato de teléfono si se proporciona
    if (phone) {
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,20}$/;
      if (!phoneRegex.test(phone)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Formato de teléfono inválido' 
          },
          { status: 400 }
        );
      }
    }
    
    // Insertar cliente
    const result = await query(`
      INSERT INTO clientes (
        user_id,
        full_name,
        email,
        phone,
        tipo_documento,
        numero_documento,
        nacionalidad,
        direccion,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id, user_id, full_name, email, phone, created_at
    `, [user.id, full_name, email, phone, tipo_documento, numero_documento, nacionalidad, direccion]);
    
    return NextResponse.json({
      success: true,
      message: 'Cliente creado exitosamente',
      data: result.rows[0]
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error al crear cliente:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al crear cliente',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// PUT - Actualizar cliente (protegido)
export async function PUT(request: Request) {
  try {
    const authResult = await protectApiRoute();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { id, full_name, email, phone, tipo_documento, numero_documento, nacionalidad, direccion } = body;
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de cliente es requerido' }, { status: 400 });
    }
    
    const result = await query(`
      UPDATE clientes 
      SET 
        full_name = COALESCE($1, full_name),
        email = COALESCE($2, email),
        phone = COALESCE($3, phone),
        tipo_documento = COALESCE($4, tipo_documento),
        numero_documento = COALESCE($5, numero_documento),
        nacionalidad = COALESCE($6, nacionalidad),
        direccion = COALESCE($7, direccion)
      WHERE id = $8 AND (
        user_id = $9 OR EXISTS (
          SELECT 1 FROM resource_shares s
          WHERE s.resource_type = 'cliente' AND s.resource_id = $8 AND s.target_user_id = $9 AND s.access = 'write'
        )
      )
      RETURNING *
    `, [full_name, email, phone, tipo_documento, numero_documento, nacionalidad, direccion, id, (authResult as any).user.id]);
    
    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Cliente no encontrado' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Cliente actualizado exitosamente',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al actualizar cliente',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar cliente (protegido)
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
          error: 'ID de cliente es requerido' 
        },
        { status: 400 }
      );
    }
    
    // Permitir al dueño o compartido con 'write'
    const canDelete = await query(`
      SELECT 1 FROM clientes c WHERE c.id = $1 AND c.user_id = $2
      UNION ALL
      SELECT 1 FROM resource_shares s WHERE s.resource_type = 'cliente' AND s.resource_id = $1 AND s.target_user_id = $2 AND s.access = 'write'
    `, [id, (authResult as any).user.id]);
    if (!canDelete.rowCount) {
      return NextResponse.json({ success: false, error: 'No autorizado para eliminar este cliente' }, { status: 403 });
    }

    // Eliminar relaciones primero (por clave foránea)
    await query('DELETE FROM expedientes_clientes WHERE cliente_id = $1', [id]);
    
    // Eliminar cliente
    const result = await query('DELETE FROM clientes WHERE id = $1 RETURNING id, full_name', [id]);
    
    if (result.rowCount === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cliente no encontrado' 
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Cliente eliminado exitosamente',
      data: { 
        id: result.rows[0].id,
        full_name: result.rows[0].full_name
      }
    });
    
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al eliminar cliente',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
