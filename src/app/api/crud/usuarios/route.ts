import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { protectApiRoute } from '@/lib/server-auth';
import { apiRateLimit, authRateLimit } from '@/lib/rate-limit';
import { requireRole, requirePermission } from '@/lib/authorization';
import { User } from '@/lib/server-auth';
import bcrypt from 'bcrypt';

// Aplicar rate limiting a todas las solicitudes
export async function GET(request: NextRequest) {
  // Aplicar rate limiting para APIs protegidas
  const rateLimitResult = await apiRateLimit(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    const authResult = await protectApiRoute();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { user } = authResult;
    
    // Verificar permisos: solo super admin puede listar usuarios (módulo de administración)
    if (!user.is_super_admin) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Forbidden',
          message: 'No tienes permiso para acceder a esta información' 
        },
        { status: 403 }
      );
    }
    
    const result = await query(`
      SELECT 
        u.id,
        u.email,
        u.email_confirmed_at,
        u.is_super_admin,
        u.created_at,
        u.updated_at,
        p.full_name,
        p.role
      FROM users u
      LEFT JOIN profiles p ON u.id = p.id
      ORDER BY u.created_at DESC
    `);
    
    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
    
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al obtener usuarios',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// Aplicar rate limiting específico para autenticación en POST
export async function POST(request: NextRequest) {
  // Aplicar rate limiting más estricto para operaciones de creación
  const rateLimitResult = await authRateLimit(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    const authResult = await protectApiRoute();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { user } = authResult;
    const body = await request.json();
    const { email, password, full_name, role = 'abogado' } = body;
    
    // Validar datos requeridos
    if (!email || !password) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Datos incompletos',
          message: 'Email y contraseña son requeridos' 
        },
        { status: 400 }
      );
    }

    // Validación de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email inválido',
          message: 'Proporcione un correo válido'
        },
        { status: 400 }
      );
    }

    // Política de contraseña: 8 a 12 dígitos (solo números)
    const passwordRegex = /^\d{8,12}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contraseña inválida',
          message: 'La contraseña debe tener entre 8 y 12 dígitos numéricos'
        },
        { status: 400 }
      );
    }
    
    // Verificar permisos: solo super administradores pueden crear usuarios
    if (!user.is_super_admin) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Forbidden',
          message: 'Solo administradores pueden crear usuarios' 
        },
        { status: 403 }
      );
    }
    
    // Verificar que el email no exista
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rowCount && existingUser.rowCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email duplicado',
          message: 'Ya existe un usuario con este email' 
        },
        { status: 409 }
      );
    }
    
    // Crear usuario con contraseña hasheada (bcrypt)
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(`
      INSERT INTO users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        is_super_admin,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        $1,
        $2,
        NOW(),
        FALSE,
        NOW(),
        NOW()
      )
      RETURNING id, email, email_confirmed_at, is_super_admin, created_at, updated_at
    `, [
      email,
      hashedPassword,
    ]);
    
    const userId = result.rows[0].id;
    
    // Crear perfil
    await query(`
      INSERT INTO profiles (
        id,
        full_name,
        role
      ) VALUES (
        $1,
        $2,
        $3
      )
    `, [
      userId,
      full_name || '',
      role
    ]);
    
    return NextResponse.json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: result.rows[0]
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al crear usuario',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  // Aplicar rate limiting para APIs protegidas
  const rateLimitResult = await apiRateLimit(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    const authResult = await protectApiRoute();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { user } = authResult;
    const body = await request.json();
    const { id, email, full_name, role } = body;
    
    // Validar ID requerido
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID requerido',
          message: 'ID del usuario es requerido' 
        },
        { status: 400 }
      );
    }
    
    // Verificar permisos: solo el propio usuario o super administradores pueden actualizar
    if (user.id !== id && !user.is_super_admin) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Forbidden',
          message: 'No tienes permiso para actualizar este usuario' 
        },
        { status: 403 }
      );
    }
    
    // Actualizar perfil
    let profileResult = null;
    if (full_name || role) {
      profileResult = await query(`
        UPDATE profiles 
        SET 
          full_name = COALESCE($1, full_name),
          role = COALESCE($2, role),
          updated_at = NOW()
        WHERE id = $3
        RETURNING id, full_name, role, updated_at
      `, [full_name, role, id]);
    }
    
    // Actualizar usuario (si se proporciona email)
    let userResult = null;
    if (email) {
      userResult = await query(`
        UPDATE users 
        SET 
          email = COALESCE($1, email),
          updated_at = NOW()
        WHERE id = $2
        RETURNING id, email, updated_at
      `, [email, id]);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: {
        user: userResult ? userResult.rows[0] : null,
        profile: profileResult ? profileResult.rows[0] : null
      }
    });
    
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al actualizar usuario',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  // Aplicar rate limiting más estricto para operaciones destructivas
  const rateLimitResult = await authRateLimit(request, { limit: 5, windowMs: 30 * 60 * 1000 }); // 5 intentos por 30 minutos
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    const authResult = await protectApiRoute();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { user } = authResult;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    // Validar ID requerido
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID requerido',
          message: 'ID del usuario es requerido' 
        },
        { status: 400 }
      );
    }
    
    // Verificar permisos: solo super administradores pueden eliminar usuarios
    if (!user.is_super_admin) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Forbidden',
          message: 'Solo administradores pueden eliminar usuarios' 
        },
        { status: 403 }
      );
    }
    
    // No permitir que un usuario se elimine a sí mismo
    if (user.id === id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Operación no permitida',
          message: 'No puedes eliminarte a ti mismo' 
        },
        { status: 400 }
      );
    }
    
    // Verificar que el usuario exista
    const existingUser = await query('SELECT id, is_super_admin FROM users WHERE id = $1', [id]);
    if (existingUser.rowCount === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Usuario no encontrado',
          message: 'El usuario especificado no existe' 
        },
        { status: 404 }
      );
    }
    
    // No permitir eliminar super admins
    if (existingUser.rows[0].is_super_admin) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Operación no permitida',
          message: 'No se pueden eliminar usuarios super admin' 
        },
        { status: 403 }
      );
    }
    
    // Eliminar perfil primero
    await query('DELETE FROM profiles WHERE id = $1', [id]);
    
    // Eliminar usuario
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    
    if (result.rowCount === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Usuario no encontrado',
          message: 'El usuario especificado no existe' 
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado exitosamente',
      data: { id }
    });
    
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al eliminar usuario',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
