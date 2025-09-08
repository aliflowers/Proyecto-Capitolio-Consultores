import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { protectApiRoute } from '@/lib/server-auth';
import { withSuperAdmin, withPermission } from '@/lib/auth-middleware';
import { grantUserPermission, revokeUserPermission, assignRoleToUser, removeRoleFromUser } from '@/lib/authorization';

// GET - Obtener permisos de un usuario específico
export async function GET(request: Request) {
  try {
    const authResult = await protectApiRoute();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { user } = authResult;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    // Validar ID requerido
    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID de usuario es requerido' 
        },
        { status: 400 }
      );
    }
    
    // Verificar que el usuario tenga permiso para ver estos permisos
    // Solo super admin o el propio usuario pueden ver sus permisos
    if (!user.is_super_admin && user.id !== userId) {
      // Verificar permiso específico
      const superAdminMiddleware = await withSuperAdmin();
      const superAdminCheck = await superAdminMiddleware(request);
      if (superAdminCheck instanceof NextResponse) {
        return superAdminCheck;
      }
    }
    
    // Obtener permisos directos del usuario
    const directPermissions = await query(
      `SELECT id, permission_key, granted, scope, created_at, updated_at 
       FROM user_permissions 
       WHERE user_id = $1 
       ORDER BY permission_key`,
      [userId]
    );
    
    // Obtener roles asignados al usuario
    const userRoles = await query(
      `SELECT ur.role_id, r.name, r.display_name, r.description, r.permissions
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1
       ORDER BY r.name`,
      [userId]
    );
    
    return NextResponse.json({
      success: true,
      data: {
        userId,
        directPermissions: directPermissions.rows,
        roles: userRoles.rows,
        count: directPermissions.rowCount
      }
    });
    
  } catch (error) {
    console.error('Error al obtener permisos de usuario:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al obtener permisos de usuario',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// POST - Otorgar permiso individual a un usuario
export async function POST(request: Request) {
  try {
    const authResult = await protectApiRoute();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { user } = authResult;
    const body = await request.json();
    const { userId, permissionKey, scope = null } = body;
    
    // Validar datos requeridos
    if (!userId || !permissionKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID de usuario y clave de permiso son requeridos' 
        },
        { status: 400 }
      );
    }
    
    // Verificar que el usuario tenga permiso para otorgar permisos
    if (!user.is_super_admin) {
      const superAdminMiddleware = await withSuperAdmin();
      const superAdminCheck = await superAdminMiddleware(request);
      if (superAdminCheck instanceof NextResponse) {
        return superAdminCheck;
      }
    }
    
    // Otorgar permiso
    const granted = await grantUserPermission(userId, permissionKey, scope);
    
    if (!granted) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error al otorgar permiso al usuario' 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Permiso otorgado exitosamente',
      data: { userId, permissionKey, scope }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error al otorgar permiso:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al otorgar permiso',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// PUT - Asignar rol a un usuario
export async function PUT(request: Request) {
  try {
    const authResult = await protectApiRoute();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { user } = authResult;
    const body = await request.json();
    const { userId, roleId } = body;
    
    // Validar datos requeridos
    if (!userId || !roleId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID de usuario y ID de rol son requeridos' 
        },
        { status: 400 }
      );
    }
    
    // Verificar que el usuario tenga permiso para asignar roles
    if (!user.is_super_admin) {
      const superAdminMiddleware = await withSuperAdmin();
      const superAdminCheck = await superAdminMiddleware(request);
      if (superAdminCheck instanceof NextResponse) {
        return superAdminCheck;
      }
    }
    
    // Asignar rol
    const assigned = await assignRoleToUser(userId, roleId, user.id);
    
    if (!assigned) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error al asignar rol al usuario' 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Rol asignado exitosamente',
      data: { userId, roleId }
    });
    
  } catch (error) {
    console.error('Error al asignar rol:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al asignar rol',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// DELETE - Revocar permiso o remover rol
export async function DELETE(request: Request) {
  try {
    const authResult = await protectApiRoute();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { user } = authResult;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const permissionKey = searchParams.get('permissionKey');
    const roleId = searchParams.get('roleId');
    
    // Validar que se proporcione al menos un parámetro
    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID de usuario es requerido' 
        },
        { status: 400 }
      );
    }
    
    // Verificar que el usuario tenga permiso para revocar permisos
    if (!user.is_super_admin) {
      const superAdminMiddleware = await withSuperAdmin();
      const superAdminCheck = await superAdminMiddleware(request);
      if (superAdminCheck instanceof NextResponse) {
        return superAdminCheck;
      }
    }
    
    // Revocar permiso individual
    if (permissionKey) {
      const revoked = await revokeUserPermission(userId, permissionKey);
      
      if (!revoked) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Error al revocar permiso del usuario' 
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Permiso revocado exitosamente',
        data: { userId, permissionKey }
      });
    }
    
    // Remover rol
    if (roleId) {
      const removed = await removeRoleFromUser(userId, roleId);
      
      if (!removed) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Error al remover rol del usuario' 
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Rol removido exitosamente',
        data: { userId, roleId }
      });
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Debe proporcionar permissionKey o roleId para eliminar' 
      },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Error al revocar permiso o remover rol:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al revocar permiso o remover rol',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
