import { query } from './db';
import { User } from './server-auth';

// Tipos para el sistema de auditoría
export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: any;
  ip_address: string;
  user_agent: string;
  created_at: Date;
}

// Crear tabla de auditoría si no existe
export async function initializeAuditTable(): Promise<void> {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL,
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(50) NOT NULL,
        resource_id UUID,
        details JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    
    // Crear índices para mejor rendimiento
    await query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
    `);
  } catch (error) {
    console.error('Error initializing audit table:', error);
  }
}

// Registrar una operación de auditoría
export async function logAuditEvent(
  user: User | null,
  action: string,
  resourceType: string,
  resourceId: string | null = null,
  details: any = null,
  ipAddress: string = '',
  userAgent: string = ''
): Promise<void> {
  try {
    await query(`
      INSERT INTO audit_logs (
        user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [
      user?.id || null,
      action,
      resourceType,
      resourceId,
      JSON.stringify(details),
      ipAddress,
      userAgent
    ]);
  } catch (error) {
    console.error('Error logging audit event:', error);
    // No lanzar error para no interrumpir la operación principal
  }
}

// Registrar operaciones de roles
export async function logRoleOperation(
  user: User,
  action: string,
  roleId: string,
  roleName: string,
  details: any = null,
  ipAddress: string = '',
  userAgent: string = ''
): Promise<void> {
  await logAuditEvent(
    user,
    action,
    'role',
    roleId,
    {
      role_name: roleName,
      ...details
    },
    ipAddress,
    userAgent
  );
}

// Registrar operaciones de permisos de usuario
export async function logUserPermissionOperation(
  user: User,
  action: string,
  targetUserId: string,
  permissionKey: string | null = null,
  roleId: string | null = null,
  details: any = null,
  ipAddress: string = '',
  userAgent: string = ''
): Promise<void> {
  await logAuditEvent(
    user,
    action,
    'user_permission',
    targetUserId,
    {
      permission_key: permissionKey,
      role_id: roleId,
      ...details
    },
    ipAddress,
    userAgent
  );
}

// Registrar operaciones de autenticación
export async function logAuthOperation(
  user: User | null,
  action: string,
  details: any = null,
  ipAddress: string = '',
  userAgent: string = ''
): Promise<void> {
  await logAuditEvent(
    user,
    action,
    'authentication',
    user?.id || null,
    details,
    ipAddress,
    userAgent
  );
}

// Obtener logs de auditoría con filtros
export async function getAuditLogs(
  limit: number = 50,
  offset: number = 0,
  filters: {
    userId?: string;
    action?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}
): Promise<AuditLog[]> {
  try {
    let queryText = `
      SELECT 
        id, user_id, action, resource_type, resource_id, 
        details, ip_address, user_agent, created_at
      FROM audit_logs
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    if (filters.userId) {
      queryText += ` AND user_id = $${paramIndex}`;
      params.push(filters.userId);
      paramIndex++;
    }
    
    if (filters.action) {
      queryText += ` AND action = $${paramIndex}`;
      params.push(filters.action);
      paramIndex++;
    }
    
    if (filters.resourceType) {
      queryText += ` AND resource_type = $${paramIndex}`;
      params.push(filters.resourceType);
      paramIndex++;
    }
    
    if (filters.startDate) {
      queryText += ` AND created_at >= $${paramIndex}`;
      params.push(filters.startDate);
      paramIndex++;
    }
    
    if (filters.endDate) {
      queryText += ` AND created_at <= $${paramIndex}`;
      params.push(filters.endDate);
      paramIndex++;
    }
    
    queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await query(queryText, params);
    return result.rows as AuditLog[];
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
}

// Obtener estadísticas de auditoría
export async function getAuditStats(
  days: number = 30
): Promise<{
  totalLogs: number;
  logsByAction: Record<string, number>;
  logsByResourceType: Record<string, number>;
  recentActivity: AuditLog[];
}> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Total de logs
    const totalResult = await query(
      'SELECT COUNT(*) as count FROM audit_logs WHERE created_at >= $1',
      [startDate]
    );
    
    // Logs por acción
    const actionResult = await query(`
      SELECT action, COUNT(*) as count 
      FROM audit_logs 
      WHERE created_at >= $1 
      GROUP BY action 
      ORDER BY count DESC
    `, [startDate]);
    
    // Logs por tipo de recurso
    const resourceResult = await query(`
      SELECT resource_type, COUNT(*) as count 
      FROM audit_logs 
      WHERE created_at >= $1 
      GROUP BY resource_type 
      ORDER BY count DESC
    `, [startDate]);
    
    // Actividad reciente
    const recentResult = await query(`
      SELECT id, user_id, action, resource_type, resource_id, 
             details, ip_address, user_agent, created_at
      FROM audit_logs 
      WHERE created_at >= $1 
      ORDER BY created_at DESC 
      LIMIT 20
    `, [startDate]);
    
    return {
      totalLogs: parseInt(totalResult.rows[0].count),
      logsByAction: actionResult.rows.reduce((acc, row) => {
        acc[row.action] = parseInt(row.count);
        return acc;
      }, {} as Record<string, number>),
      logsByResourceType: resourceResult.rows.reduce((acc, row) => {
        acc[row.resource_type] = parseInt(row.count);
        return acc;
      }, {} as Record<string, number>),
      recentActivity: recentResult.rows as AuditLog[]
    };
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    return {
      totalLogs: 0,
      logsByAction: {},
      logsByResourceType: {},
      recentActivity: []
    };
  }
}
