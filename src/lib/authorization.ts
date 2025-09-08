import { query } from './db';
import { User } from './server-auth';

// Tipos para el sistema de autorización
export interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string;
  permissions: Record<string, string[]>;
  is_system_role: boolean;
  can_be_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserPermission {
  id: string;
  user_id: string;
  permission_key: string;
  granted: boolean;
  scope: any;
  created_at: Date;
  updated_at: Date;
}

export interface UserRole {
  user_id: string;
  role_id: string;
  assigned_by: string;
  assigned_at: Date;
}

// Verificar si un usuario tiene un rol específico
export async function userHasRole(userId: string, roleName: string): Promise<boolean> {
  try {
    const result = await query(
      `SELECT 1 FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1 AND r.name = $2`,
      [userId, roleName]
    );
    return result.rowCount ? result.rowCount > 0 : false;
  } catch (error) {
    console.error('Error checking user role:', error);
    return false;
  }
}

// Verificar si un usuario tiene un permiso específico
export async function userHasPermission(userId: string, resource: string, action: string): Promise<boolean> {
  try {
    // Primero verificar permisos directos del usuario
    const directPermission = await query(
      `SELECT 1 FROM user_permissions 
       WHERE user_id = $1 AND permission_key = $2 AND granted = true`,
      [userId, `${resource}:${action}`]
    );
    
    if (directPermission.rowCount && directPermission.rowCount > 0) {
      return true;
    }
    
    // Luego verificar permisos heredados de roles
    const rolePermissions = await query(
      `SELECT r.permissions FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [userId]
    );
    
    for (const row of rolePermissions.rows) {
      const permissions = row.permissions as Record<string, string[]>;
      if (permissions[resource] && permissions[resource].includes(action)) {
        return true;
      }
      // Verificar permiso wildcard
      if (permissions[resource] && permissions[resource].includes('*')) {
        return true;
      }
      // Verificar permiso global
      if (permissions['*'] && (permissions['*'].includes(action) || permissions['*'].includes('*'))) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking user permission:', error);
    return false;
  }
}

// Verificar si un usuario tiene acceso a un recurso específico
export async function userCanAccessResource(userId: string, resource: string, resourceId: string): Promise<boolean> {
  try {
    // Para recursos propios del usuario, siempre permitir
    if (resource === 'own') {
      return true;
    }
    
    // Verificar si el usuario es super admin
    const userResult = await query(
      'SELECT is_super_admin FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rowCount && userResult.rowCount > 0 && userResult.rows[0].is_super_admin) {
      return true;
    }
    
    // Verificar permisos específicos del recurso
    switch (resource) {
      case 'cases':
        return await userHasPermission(userId, 'cases', 'read');
      case 'clients':
        return await userHasPermission(userId, 'clients', 'read');
      case 'documents':
        return await userHasPermission(userId, 'documents', 'read');
      case 'users':
        return await userHasPermission(userId, 'users', 'read');
      default:
        return false;
    }
  } catch (error) {
    console.error('Error checking resource access:', error);
    return false;
  }
}

// Middleware para proteger rutas por rol
export async function requireRole(user: User, roleName: string): Promise<boolean> {
  if (user.is_super_admin) {
    return true;
  }
  return await userHasRole(user.id, roleName);
}

// Middleware para proteger rutas por permiso
export async function requirePermission(user: User, resource: string, action: string): Promise<boolean> {
  if (user.is_super_admin) {
    return true;
  }
  return await userHasPermission(user.id, resource, action);
}

// Obtener todos los roles de un usuario
export async function getUserRoles(userId: string): Promise<Role[]> {
  try {
    const result = await query(
      `SELECT r.* FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [userId]
    );
    return result.rows as Role[];
  } catch (error) {
    console.error('Error getting user roles:', error);
    return [];
  }
}

// Obtener todos los permisos de un usuario (incluyendo los heredados de roles)
export async function getUserPermissions(userId: string): Promise<string[]> {
  try {
    const permissions = new Set<string>();
    
    // Obtener permisos directos del usuario
    const directPermissions = await query(
      `SELECT permission_key FROM user_permissions 
       WHERE user_id = $1 AND granted = true`,
      [userId]
    );
    
    for (const row of directPermissions.rows) {
      permissions.add(row.permission_key);
    }
    
    // Obtener permisos heredados de roles
    const rolePermissions = await query(
      `SELECT r.permissions FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [userId]
    );
    
    for (const row of rolePermissions.rows) {
      const perms = row.permissions as Record<string, string[]>;
      for (const [resource, actions] of Object.entries(perms)) {
        for (const action of actions) {
          permissions.add(`${resource}:${action}`);
        }
      }
    }
    
    return Array.from(permissions);
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
}

// Asignar un rol a un usuario
export async function assignRoleToUser(userId: string, roleId: string, assignedBy: string): Promise<boolean> {
  try {
    await query(
      `INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, role_id) DO NOTHING`,
      [userId, roleId, assignedBy]
    );
    return true;
  } catch (error) {
    console.error('Error assigning role to user:', error);
    return false;
  }
}

// Remover un rol de un usuario
export async function removeRoleFromUser(userId: string, roleId: string): Promise<boolean> {
  try {
    await query(
      'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2',
      [userId, roleId]
    );
    return true;
  } catch (error) {
    console.error('Error removing role from user:', error);
    return false;
  }
}

// Otorgar un permiso individual a un usuario
export async function grantUserPermission(userId: string, permissionKey: string, scope: any = null): Promise<boolean> {
  try {
    await query(
      `INSERT INTO user_permissions (user_id, permission_key, granted, scope, created_at, updated_at)
       VALUES ($1, $2, true, $3, NOW(), NOW())
       ON CONFLICT (user_id, permission_key) 
       DO UPDATE SET granted = true, scope = $3, updated_at = NOW()`,
      [userId, permissionKey, scope]
    );
    return true;
  } catch (error) {
    console.error('Error granting user permission:', error);
    return false;
  }
}

// Revocar un permiso individual de un usuario
export async function revokeUserPermission(userId: string, permissionKey: string): Promise<boolean> {
  try {
    await query(
      `UPDATE user_permissions 
       SET granted = false, updated_at = NOW()
       WHERE user_id = $1 AND permission_key = $2`,
      [userId, permissionKey]
    );
    return true;
  } catch (error) {
    console.error('Error revoking user permission:', error);
    return false;
  }
}
