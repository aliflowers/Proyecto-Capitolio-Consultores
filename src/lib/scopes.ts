import { query } from './db';

// Definición de scopes por módulo
export interface ScopeDefinition {
  module: string;
  resource: string;
  actions: string[];
  description: string;
}

// Scopes para el módulo de expedientes
export const EXPEDIENTE_SCOPES: ScopeDefinition[] = [
  {
    module: 'expedientes',
    resource: 'expedientes',
    actions: ['create', 'read', 'update', 'delete', 'assign', 'export'],
    description: 'Operaciones completas sobre expedientes'
  },
  {
    module: 'expedientes',
    resource: 'expediente_timeline',
    actions: ['read', 'create', 'update'],
    description: 'Gestión de línea de tiempo de expedientes'
  },
  {
    module: 'expedientes',
    resource: 'expediente_tasks',
    actions: ['create', 'read', 'update', 'delete', 'complete'],
    description: 'Gestión de tareas de expedientes'
  },
  {
    module: 'expedientes',
    resource: 'expediente_documents',
    actions: ['attach', 'detach', 'read'],
    description: 'Gestión de documentos asociados a expedientes'
  }
];

// Scopes para el módulo de clientes
export const CLIENT_SCOPES: ScopeDefinition[] = [
  {
    module: 'clients',
    resource: 'clients',
    actions: ['create', 'read', 'update', 'delete'],
    description: 'Operaciones completas sobre clientes'
  },
  {
    module: 'clients',
    resource: 'client_contacts',
    actions: ['create', 'read', 'update', 'delete'],
    description: 'Gestión de contactos de clientes'
  },
  {
    module: 'clients',
    resource: 'client_documents',
    actions: ['attach', 'read'],
    description: 'Gestión de documentos de clientes'
  }
];

// Scopes para el módulo de documentos
export const DOCUMENT_SCOPES: ScopeDefinition[] = [
  {
    module: 'documents',
    resource: 'documents',
    actions: ['create', 'read', 'update', 'delete', 'download'],
    description: 'Operaciones completas sobre documentos'
  },
  {
    module: 'documents',
    resource: 'document_versions',
    actions: ['create', 'read', 'compare'],
    description: 'Gestión de versiones de documentos'
  },
  {
    module: 'documents',
    resource: 'document_processing',
    actions: ['process', 'analyze'],
    description: 'Procesamiento y análisis de documentos'
  }
];

// Scopes para el módulo de usuarios
export const USER_SCOPES: ScopeDefinition[] = [
  {
    module: 'users',
    resource: 'users',
    actions: ['create', 'read', 'update', 'delete'],
    description: 'Gestión de usuarios'
  },
  {
    module: 'users',
    resource: 'user_roles',
    actions: ['assign', 'remove', 'view'],
    description: 'Gestión de roles de usuarios'
  },
  {
    module: 'users',
    resource: 'user_permissions',
    actions: ['grant', 'revoke', 'view'],
    description: 'Gestión de permisos individuales'
  }
];

// Todos los scopes disponibles
export const ALL_SCOPES: ScopeDefinition[] = [
  ...EXPEDIENTE_SCOPES,
  ...CLIENT_SCOPES,
  ...DOCUMENT_SCOPES,
  ...USER_SCOPES
];

// Verificar si un usuario tiene un scope específico
export async function userHasScope(userId: string, resource: string, action: string): Promise<boolean> {
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
      const permissions = row.permissions;
      if (permissions && typeof permissions === 'object') {
        const perms = permissions as Record<string, string[]>;
        if (perms[resource] && perms[resource].includes(action)) {
          return true;
        }
        // Verificar permiso wildcard
        if (perms[resource] && perms[resource].includes('*')) {
          return true;
        }
        // Verificar permiso global
        if (perms['*'] && (perms['*'].includes(action) || perms['*'].includes('*'))) {
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking user scope:', error);
    return false;
  }
}

// Verificar si un usuario tiene acceso a un recurso específico con scope
export async function userCanAccessResourceWithScope(
  userId: string, 
  resource: string, 
  action: string, 
  resourceId?: string
): Promise<boolean> {
  try {
    // Verificar si el usuario es super admin
    const userResult = await query(
      'SELECT is_super_admin FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rowCount && userResult.rowCount > 0 && userResult.rows[0].is_super_admin) {
      return true;
    }
    
    // Verificar scope específico
    const hasScope = await userHasScope(userId, resource, action);
    if (!hasScope) {
      return false;
    }
    
    // Si se proporciona un resourceId, verificar RLS (Row Level Security)
    if (resourceId) {
      return await checkRLSPolicy(userId, resource, resourceId);
    }
    
    return true;
  } catch (error) {
    console.error('Error checking resource access with scope:', error);
    return false;
  }
}

// Verificar políticas RLS para un recurso específico
async function checkRLSPolicy(userId: string, resource: string, resourceId: string): Promise<boolean> {
  try {
    let tableName = '';
    const ownerIdField = 'user_id'; // Asumimos que la columna de propietario es user_id
    
    // Mapear recursos a tablas
    switch (resource) {
      case 'expedientes':
        tableName = 'expedientes';
        break;
      case 'clients':
        tableName = 'clientes';
        break;
      case 'documents':
        tableName = 'documentos';
        break;
      default:
        // Denegar por defecto si el recurso no se reconoce para la comprobación de RLS.
        return false;
    }
    
    // Verificar si el usuario es el propietario del recurso
    const result = await query(
      `SELECT 1 FROM ${tableName} 
       WHERE id = $1 AND ${ownerIdField} = $2`,
      [resourceId, userId]
    );
    
    return result.rowCount ? result.rowCount > 0 : false;
  } catch (error) {
    console.error('Error checking RLS policy:', error);
    return false;
  }
}

// Obtener todos los scopes disponibles para un usuario
export async function getUserAvailableScopes(userId: string): Promise<ScopeDefinition[]> {
  try {
    const userScopes = new Set<string>();
    const availableScopes: ScopeDefinition[] = [];
    
    // Obtener permisos directos del usuario
    const directPermissions = await query(
      `SELECT permission_key FROM user_permissions 
       WHERE user_id = $1 AND granted = true`,
      [userId]
    );
    
    for (const row of directPermissions.rows) {
      userScopes.add(row.permission_key);
    }
    
    // Obtener permisos heredados de roles
    const rolePermissions = await query(
      `SELECT r.permissions FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [userId]
    );
    
    for (const row of rolePermissions.rows) {
      const permissions = row.permissions;
      if (permissions && typeof permissions === 'object') {
        const perms = permissions as Record<string, string[]>;
        for (const [resource, actions] of Object.entries(perms)) {
          for (const action of actions) {
            userScopes.add(`${resource}:${action}`);
          }
        }
      }
    }
    
    // Filtrar scopes disponibles según permisos del usuario
    for (const scope of ALL_SCOPES) {
      let hasAccess = false;
      for (const action of scope.actions) {
        if (userScopes.has(`${scope.resource}:${action}`) || userScopes.has(`${scope.resource}:*`)) {
          hasAccess = true;
          break;
        }
      }
      if (hasAccess) {
        availableScopes.push(scope);
      }
    }
    
    return availableScopes;
  } catch (error) {
    console.error('Error getting user available scopes:', error);
    return [];
  }
}
