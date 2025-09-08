import { NextResponse } from 'next/server';
import { getCurrentUser } from './server-auth';
import { userHasRole, userHasPermission } from './authorization';

// Middleware para proteger rutas por rol
export async function withRole(requiredRole: string) {
  return async function middleware(request: Request) {
    try {
      const user = await getCurrentUser();
      
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'No autorizado. Debe iniciar sesión.' },
          { status: 401 }
        );
      }
      
      const hasRole = await userHasRole(user.id, requiredRole);
      if (!hasRole && !user.is_super_admin) {
        return NextResponse.json(
          { success: false, error: `Se requiere el rol: ${requiredRole}` },
          { status: 403 }
        );
      }
      
      return null; // Permitir continuar
    } catch (error) {
      console.error('Error en middleware de rol:', error);
      return NextResponse.json(
        { success: false, error: 'Error de autorización' },
        { status: 500 }
      );
    }
  };
}

// Middleware para proteger rutas por permiso
export async function withPermission(resource: string, action: string) {
  return async function middleware(request: Request) {
    try {
      const user = await getCurrentUser();
      
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'No autorizado. Debe iniciar sesión.' },
          { status: 401 }
        );
      }
      
      const hasPermission = await userHasPermission(user.id, resource, action);
      if (!hasPermission && !user.is_super_admin) {
        return NextResponse.json(
          { success: false, error: `Se requiere permiso: ${resource}:${action}` },
          { status: 403 }
        );
      }
      
      return null; // Permitir continuar
    } catch (error) {
      console.error('Error en middleware de permiso:', error);
      return NextResponse.json(
        { success: false, error: 'Error de autorización' },
        { status: 500 }
      );
    }
  };
}

// Middleware compuesto para múltiples permisos (OR)
export async function withAnyPermission(permissions: Array<{resource: string, action: string}>) {
  return async function middleware(request: Request) {
    try {
      const user = await getCurrentUser();
      
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'No autorizado. Debe iniciar sesión.' },
          { status: 401 }
        );
      }
      
      if (user.is_super_admin) {
        return null; // Permitir continuar
      }
      
      let hasAnyPermission = false;
      for (const { resource, action } of permissions) {
        const hasPermission = await userHasPermission(user.id, resource, action);
        if (hasPermission) {
          hasAnyPermission = true;
          break;
        }
      }
      
      if (!hasAnyPermission) {
        const permissionList = permissions.map(p => `${p.resource}:${p.action}`).join(', ');
        return NextResponse.json(
          { success: false, error: `Se requiere alguno de los permisos: ${permissionList}` },
          { status: 403 }
        );
      }
      
      return null; // Permitir continuar
    } catch (error) {
      console.error('Error en middleware de permisos múltiples:', error);
      return NextResponse.json(
        { success: false, error: 'Error de autorización' },
        { status: 500 }
      );
    }
  };
}

// Middleware compuesto para múltiples permisos (AND)
export async function withAllPermissions(permissions: Array<{resource: string, action: string}>) {
  return async function middleware(request: Request) {
    try {
      const user = await getCurrentUser();
      
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'No autorizado. Debe iniciar sesión.' },
          { status: 401 }
        );
      }
      
      if (user.is_super_admin) {
        return null; // Permitir continuar
      }
      
      let hasAllPermissions = true;
      for (const { resource, action } of permissions) {
        const hasPermission = await userHasPermission(user.id, resource, action);
        if (!hasPermission) {
          hasAllPermissions = false;
          break;
        }
      }
      
      if (!hasAllPermissions) {
        const permissionList = permissions.map(p => `${p.resource}:${p.action}`).join(', ');
        return NextResponse.json(
          { success: false, error: `Se requieren todos los permisos: ${permissionList}` },
          { status: 403 }
        );
      }
      
      return null; // Permitir continuar
    } catch (error) {
      console.error('Error en middleware de permisos múltiples:', error);
      return NextResponse.json(
        { success: false, error: 'Error de autorización' },
        { status: 500 }
      );
    }
  };
}

// Middleware para solo super admin
export async function withSuperAdmin() {
  return async function middleware(request: Request) {
    try {
      const user = await getCurrentUser();
      
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'No autorizado. Debe iniciar sesión.' },
          { status: 401 }
        );
      }
      
      if (!user.is_super_admin) {
        return NextResponse.json(
          { success: false, error: 'Se requiere ser Super Administrador' },
          { status: 403 }
        );
      }
      
      return null; // Permitir continuar
    } catch (error) {
      console.error('Error en middleware de super admin:', error);
      return NextResponse.json(
        { success: false, error: 'Error de autorización' },
        { status: 500 }
      );
    }
  };
}
