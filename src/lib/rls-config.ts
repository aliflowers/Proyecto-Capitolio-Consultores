// Configuración de políticas RLS (Row Level Security) para Nexus Jurídico

// Interface para definir políticas RLS
export interface RLSPolicyConfig {
  tableName: string;
  policyName: string;
  usingCondition: string;
  withCheckCondition?: string;
  roles: string[];
  command: 'ALL' | 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  description: string;
}

// Políticas RLS para la tabla de expedientes
export const EXPEDIENTE_RLS_POLICIES: RLSPolicyConfig[] = [
  {
    tableName: 'expedientes',
    policyName: 'expedientes_select_policy',
    usingCondition: `(user_id = current_setting('app.current_user_id')::uuid OR 
                      EXISTS(SELECT 1 FROM user_roles ur 
                             JOIN roles r ON ur.role_id = r.id 
                             WHERE ur.user_id = current_setting('app.current_user_id')::uuid 
                             AND r.permissions->>'expedientes' IS NOT NULL))`,
    roles: ['public'],
    command: 'SELECT',
    description: 'Permitir selección de expedientes propios o con permisos adecuados'
  },
  {
    tableName: 'expedientes',
    policyName: 'expedientes_modify_policy',
    usingCondition: `user_id = current_setting('app.current_user_id')::uuid`,
    withCheckCondition: `user_id = current_setting('app.current_user_id')::uuid`,
    roles: ['public'],
    command: 'ALL',
    description: 'Permitir modificación solo de expedientes propios'
  }
];

// Políticas RLS para la tabla de clientes
export const CLIENT_RLS_POLICIES: RLSPolicyConfig[] = [
  {
    tableName: 'clientes',
    policyName: 'clientes_select_policy',
    usingCondition: `(user_id = current_setting('app.current_user_id')::uuid OR 
                      EXISTS(SELECT 1 FROM user_roles ur 
                             JOIN roles r ON ur.role_id = r.id 
                             WHERE ur.user_id = current_setting('app.current_user_id')::uuid 
                             AND r.permissions->>'clients' IS NOT NULL))`,
    roles: ['public'],
    command: 'SELECT',
    description: 'Permitir selección de clientes propios o con permisos adecuados'
  },
  {
    tableName: 'clientes',
    policyName: 'clientes_modify_policy',
    usingCondition: `user_id = current_setting('app.current_user_id')::uuid`,
    withCheckCondition: `user_id = current_setting('app.current_user_id')::uuid`,
    roles: ['public'],
    command: 'ALL',
    description: 'Permitir modificación solo de clientes propios'
  }
];

// Políticas RLS para la tabla de documentos
export const DOCUMENT_RLS_POLICIES: RLSPolicyConfig[] = [
  {
    tableName: 'documentos',
    policyName: 'documentos_select_policy',
    usingCondition: `(user_id = current_setting('app.current_user_id')::uuid OR 
                      EXISTS(SELECT 1 FROM user_roles ur 
                             JOIN roles r ON ur.role_id = r.id 
                             WHERE ur.user_id = current_setting('app.current_user_id')::uuid 
                             AND r.permissions->>'documents' IS NOT NULL))`,
    roles: ['public'],
    command: 'SELECT',
    description: 'Permitir selección de documentos propios o con permisos adecuados'
  },
  {
    tableName: 'documentos',
    policyName: 'documentos_modify_policy',
    usingCondition: `user_id = current_setting('app.current_user_id')::uuid`,
    withCheckCondition: `user_id = current_setting('app.current_user_id')::uuid`,
    roles: ['public'],
    command: 'ALL',
    description: 'Permitir modificación solo de documentos propios'
  }
];

// Políticas RLS para la tabla de chunks de documentos
export const DOCUMENT_CHUNKS_RLS_POLICIES: RLSPolicyConfig[] = [
  {
    tableName: 'document_chunks',
    policyName: 'document_chunks_select_policy',
    usingCondition: `(EXISTS(SELECT 1 FROM documentos d 
                             WHERE d.id = document_chunks.document_id 
                             AND (d.user_id = current_setting('app.current_user_id')::uuid OR 
                                  EXISTS(SELECT 1 FROM user_roles ur 
                                         JOIN roles r ON ur.role_id = r.id 
                                         WHERE ur.user_id = current_setting('app.current_user_id')::uuid 
                                         AND r.permissions->>'documents' IS NOT NULL))))`,
    roles: ['public'],
    command: 'SELECT',
    description: 'Permitir selección de chunks de documentos propios o con permisos adecuados'
  },
  {
    tableName: 'document_chunks',
    policyName: 'document_chunks_modify_policy',
    usingCondition: `(EXISTS(SELECT 1 FROM documentos d 
                             WHERE d.id = document_chunks.document_id 
                             AND d.user_id = current_setting('app.current_user_id')::uuid))`,
    withCheckCondition: `(EXISTS(SELECT 1 FROM documentos d 
                                 WHERE d.id = document_chunks.document_id 
                                 AND d.user_id = current_setting('app.current_user_id')::uuid))`,
    roles: ['public'],
    command: 'ALL',
    description: 'Permitir modificación solo de chunks de documentos propios'
  }
];

// Políticas RLS para la tabla de expedientes_clientes (relaciones)
export const EXPEDIENTE_CLIENT_RELATIONS_RLS_POLICIES: RLSPolicyConfig[] = [
  {
    tableName: 'expedientes_clientes',
    policyName: 'expedientes_clientes_select_policy',
    usingCondition: `(EXISTS(SELECT 1 FROM expedientes e 
                             WHERE e.id = expedientes_clientes.expediente_id 
                             AND (e.user_id = current_setting('app.current_user_id')::uuid OR 
                                  EXISTS(SELECT 1 FROM user_roles ur 
                                         JOIN roles r ON ur.role_id = r.id 
                                         WHERE ur.user_id = current_setting('app.current_user_id')::uuid 
                                         AND r.permissions->>'expedientes' IS NOT NULL))))`,
    roles: ['public'],
    command: 'SELECT',
    description: 'Permitir selección de relaciones expedientes-clientes con permisos adecuados'
  },
  {
    tableName: 'expedientes_clientes',
    policyName: 'expedientes_clientes_modify_policy',
    usingCondition: `(EXISTS(SELECT 1 FROM expedientes e 
                             WHERE e.id = expedientes_clientes.expediente_id 
                             AND e.user_id = current_setting('app.current_user_id')::uuid))`,
    withCheckCondition: `(EXISTS(SELECT 1 FROM expedientes e 
                                 WHERE e.id = expedientes_clientes.expediente_id 
                                 AND e.user_id = current_setting('app.current_user_id')::uuid))`,
    roles: ['public'],
    command: 'ALL',
    description: 'Permitir modificación solo de relaciones expedientes-clientes de expedientes propios'
  }
];

// Políticas RLS para la tabla de expedientes_documentos (relaciones)
export const EXPEDIENTE_DOCUMENT_RELATIONS_RLS_POLICIES: RLSPolicyConfig[] = [
  {
    tableName: 'expedientes_documentos',
    policyName: 'expedientes_documentos_select_policy',
    usingCondition: `(EXISTS(SELECT 1 FROM expedientes e 
                             WHERE e.id = expedientes_documentos.expediente_id 
                             AND (e.user_id = current_setting('app.current_user_id')::uuid OR 
                                  EXISTS(SELECT 1 FROM user_roles ur 
                                         JOIN roles r ON ur.role_id = r.id 
                                         WHERE ur.user_id = current_setting('app.current_user_id')::uuid 
                                         AND r.permissions->>'expedientes' IS NOT NULL))))`,
    roles: ['public'],
    command: 'SELECT',
    description: 'Permitir selección de relaciones expedientes-documentos con permisos adecuados'
  },
  {
    tableName: 'expedientes_documentos',
    policyName: 'expedientes_documentos_modify_policy',
    usingCondition: `(EXISTS(SELECT 1 FROM expedientes e 
                             WHERE e.id = expedientes_documentos.expediente_id 
                             AND e.user_id = current_setting('app.current_user_id')::uuid))`,
    withCheckCondition: `(EXISTS(SELECT 1 FROM expedientes e 
                                 WHERE e.id = expedientes_documentos.expediente_id 
                                 AND e.user_id = current_setting('app.current_user_id')::uuid))`,
    roles: ['public'],
    command: 'ALL',
    description: 'Permitir modificación solo de relaciones expedientes-documentos de expedientes propios'
  }
];

// Todas las políticas RLS agrupadas por tabla
export const ALL_RLS_POLICIES: Record<string, RLSPolicyConfig[]> = {
  'expedientes': EXPEDIENTE_RLS_POLICIES,
  'clientes': CLIENT_RLS_POLICIES,
  'documentos': DOCUMENT_RLS_POLICIES,
  'document_chunks': DOCUMENT_CHUNKS_RLS_POLICIES,
  'expedientes_clientes': EXPEDIENTE_CLIENT_RELATIONS_RLS_POLICIES,
  'expedientes_documentos': EXPEDIENTE_DOCUMENT_RELATIONS_RLS_POLICIES
};

// Función para generar el SQL de creación de políticas RLS
export function generateRLSPolicySQL(policy: RLSPolicyConfig): string {
  let sql = `CREATE POLICY ${policy.policyName} ON ${policy.tableName} `;
  
  if (policy.roles && policy.roles.length > 0) {
    sql += `FOR ${policy.command} TO ${policy.roles.join(', ')} `;
  } else {
    sql += `FOR ${policy.command} `;
  }
  
  sql += `USING (${policy.usingCondition})`;
  
  if (policy.withCheckCondition) {
    sql += ` WITH CHECK (${policy.withCheckCondition})`;
  }
  
  return sql;
}

// Función para generar el SQL de eliminación de políticas RLS
export function generateDropRLSPolicySQL(tableName: string, policyName: string): string {
  return `DROP POLICY IF EXISTS ${policyName} ON ${tableName}`;
}

// Función para generar el SQL de habilitación de RLS
export function generateEnableRLSSQL(tableName: string): string {
  return `ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY`;
}

// Función para verificar si una tabla tiene RLS habilitado
export function generateCheckRLSEnabledSQL(tableName: string): string {
  return `SELECT relname, relrowsecurity FROM pg_class WHERE relname = '${tableName}' AND relrowsecurity = true`;
}

// Función para listar todas las políticas RLS
export function generateListRLSPoliciesSQL(): string {
  return `
    SELECT 
      policyname as policy_name,
      schemaname as schema_name,
      tablename as table_name,
      roles,
      cmd as command,
      qual as using_condition,
      with_check
    FROM pg_policies 
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname
  `;
}
