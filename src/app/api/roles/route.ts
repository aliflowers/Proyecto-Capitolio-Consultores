import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { protectApiRoute } from '@/lib/server-auth';
import { withSuperAdmin } from '@/lib/auth-middleware';

// GET - Obtener todos los roles
export async function GET(request: Request) {
  try {
    const authResult = await protectApiRoute();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    // Verificar permisos de super admin
    const superAdminMiddleware = await withSuperAdmin();
    const superAdminCheck = await superAdminMiddleware(request);
    if (superAdminCheck instanceof NextResponse) {
      return superAdminCheck;
    }
    
    const result = await query(`
      SELECT 
        id,
        name,
        display_name,
        description,
        permissions,
        is_system_role,
        can_be_deleted,
        created_at,
        updated_at
      FROM roles
      ORDER BY name
    `);
    
    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
    
  } catch (error) {
    console.error('Error al obtener roles:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al obtener roles',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo rol
export async function POST(request: Request) {
  try {
    const authResult = await protectApiRoute();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    // Verificar permisos de super admin
    const superAdminMiddleware = await withSuperAdmin();
    const superAdminCheck = await superAdminMiddleware(request);
    if (superAdminCheck instanceof NextResponse) {
      return superAdminCheck;
    }
    
    const body = await request.json();
    const { name, display_name, description, permissions = {} } = body;
    
    // Validar datos requeridos
    if (!name) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Nombre del rol es requerido' 
        },
        { status: 400 }
      );
    }
    
    // Validar formato del nombre
    const nameRegex = /^[a-z0-9_]+$/;
    if (!nameRegex.test(name)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Formato de nombre inválido. Solo letras minúsculas, números y guiones bajos.' 
        },
        { status: 400 }
      );
    }
    
    // Insertar rol
    const result = await query(`
      INSERT INTO roles (
        name,
        display_name,
        description,
        permissions,
        is_system_role,
        can_be_deleted,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (name) DO NOTHING
      RETURNING id, name, display_name, description, permissions, is_system_role, can_be_deleted, created_at, updated_at
    `, [name, display_name || name, description, JSON.stringify(permissions), false, true]);
    
    if (result.rowCount === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'El rol ya existe' 
        },
        { status: 409 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Rol creado exitosamente',
      data: result.rows[0]
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error al crear rol:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al crear rol',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// PUT - Actualizar rol
export async function PUT(request: Request) {
  try {
    const authResult = await protectApiRoute();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    // Verificar permisos de super admin
    const superAdminMiddleware = await withSuperAdmin();
    const superAdminCheck = await superAdminMiddleware(request);
    if (superAdminCheck instanceof NextResponse) {
      return superAdminCheck;
    }
    
    const body = await request.json();
    const { id, display_name, description, permissions } = body;
    
    // Validar ID requerido
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID del rol es requerido' 
        },
        { status: 400 }
      );
    }
    
    // Verificar que no sea un rol del sistema
    const roleCheck = await query(
      'SELECT is_system_role FROM roles WHERE id = $1',
      [id]
    );
    
    if (roleCheck.rowCount === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rol no encontrado' 
        },
        { status: 404 }
      );
    }
    
    if (roleCheck.rows[0].is_system_role) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No se puede modificar un rol del sistema' 
        },
        { status: 403 }
      );
    }
    
    // Actualizar rol
    const result = await query(`
      UPDATE roles 
      SET 
        display_name = COALESCE($1, display_name),
        description = COALESCE($2, description),
        permissions = COALESCE($3, permissions),
        updated_at = NOW()
      WHERE id = $4 AND is_system_role = false
      RETURNING id, name, display_name, description, permissions, is_system_role, can_be_deleted, created_at, updated_at
    `, [display_name, description, permissions ? JSON.stringify(permissions) : null, id]);
    
    if (result.rowCount === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rol no encontrado o es un rol del sistema' 
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Rol actualizado exitosamente',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error al actualizar rol:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al actualizar rol',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar rol
export async function DELETE(request: Request) {
  try {
    const authResult = await protectApiRoute();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    // Verificar permisos de super admin
    const superAdminMiddleware = await withSuperAdmin();
    const superAdminCheck = await superAdminMiddleware(request);
    if (superAdminCheck instanceof NextResponse) {
      return superAdminCheck;
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    // Validar ID requerido
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID del rol es requerido' 
        },
        { status: 400 }
      );
    }
    
    // Verificar que no sea un rol del sistema y que se pueda eliminar
    const roleCheck = await query(
      'SELECT is_system_role, can_be_deleted FROM roles WHERE id = $1',
      [id]
    );
    
    if (roleCheck.rowCount === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rol no encontrado' 
        },
        { status: 404 }
      );
    }
    
    const role = roleCheck.rows[0];
    if (role.is_system_role) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No se puede eliminar un rol del sistema' 
        },
        { status: 403 }
      );
    }
    
    if (!role.can_be_deleted) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Este rol no se puede eliminar' 
        },
        { status: 403 }
      );
    }
    
    // Eliminar asignaciones de roles primero
    await query('DELETE FROM user_roles WHERE role_id = $1', [id]);
    
    // Eliminar rol
    const result = await query(
      'DELETE FROM roles WHERE id = $1 AND is_system_role = false AND can_be_deleted = true RETURNING id, name',
      [id]
    );
    
    if (result.rowCount === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rol no encontrado o no se puede eliminar' 
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Rol eliminado exitosamente',
      data: { 
        id: result.rows[0].id,
        name: result.rows[0].name
      }
    });
    
  } catch (error) {
    console.error('Error al eliminar rol:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al eliminar rol',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
