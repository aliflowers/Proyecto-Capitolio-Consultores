import { query } from './db';

// Interface para definir políticas RLS
export interface RLSPolicy {
  tableName: string;
  policyName: string;
  usingCondition: string;
  withCheckCondition?: string;
  roles: string[];
  command: 'ALL' | 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  description: string;
}

// Políticas RLS para la tabla de expedientes
export const EXPEDIENTE_RLS_POLICIES: RLSPolicy[] = [
  {
    tableName: 'expedientes',
    policyName: 'expedientes_select_policy',
    usingCondition: `(user_id = current_setting('app.current_user_id')::uuid OR 
                      EXISTS(SELECT 1 FROM user_roles ur 
                             JOIN roles r ON ur.role_id = r.id 
                             WHERE ur.user_id = current_setting('app.current_user_id')::uuid 
                             AND r.permissions->>'expedientes' IS NOT NULL))`,
    roles: ['PUBLIC'],
    command: 'SELECT',
    description: 'Permitir selección de expedientes propios o con permisos adecuados'
  },
  {
    tableName: 'expedientes',
    policyName: 'expedientes_modify_policy',
    usingCondition: `user_id = current_setting('app.current_user_id')::uuid`,
    withCheckCondition: `user_id = current_setting('app.current_user_id')::uuid`,
    roles: ['PUBLIC'],
    command: 'ALL',
    description: 'Permitir modificación solo de expedientes propios'
  }
];

// Políticas RLS para la tabla de clientes
export const CLIENT_RLS_POLICIES: RLSPolicy[] = [
  {
    tableName: 'clientes',
    policyName: 'clientes_select_policy',
    usingCondition: `(user_id = current_setting('app.current_user_id')::uuid OR 
                      EXISTS(SELECT 1 FROM user_roles ur 
                             JOIN roles r ON ur.role_id = r.id 
                             WHERE ur.user_id = current_setting('app.current_user_id')::uuid 
                             AND r.permissions->>'clients' IS NOT NULL))`,
    roles: ['PUBLIC'],
    command: 'SELECT',
    description: 'Permitir selección de clientes propios o con permisos adecuados'
  },
  {
    tableName: 'clientes',
    policyName: 'clientes_modify_policy',
    usingCondition: `user_id = current_setting('app.current_user_id')::uuid`,
    withCheckCondition: `user_id = current_setting('app.current_user_id')::uuid`,
    roles: ['PUBLIC'],
    command: 'ALL',
    description: 'Permitir modificación solo de clientes propios'
  }
];

// Políticas RLS para la tabla de documentos
export const DOCUMENT_RLS_POLICIES: RLSPolicy[] = [
  {
    tableName: 'documentos',
    policyName: 'documentos_select_policy',
    usingCondition: `(user_id = current_setting('app.current_user_id')::uuid OR 
                      EXISTS(SELECT 1 FROM user_roles ur 
                             JOIN roles r ON ur.role_id = r.id 
                             WHERE ur.user_id = current_setting('app.current_user_id')::uuid 
                             AND r.permissions->>'documents' IS NOT NULL))`,
    roles: ['PUBLIC'],
    command: 'SELECT',
    description: 'Permitir selección de documentos propios o con permisos adecuados'
  },
  {
    tableName: 'documentos',
    policyName: 'documentos_modify_policy',
    usingCondition: `user_id = current_setting('app.current_user_id')::uuid`,
    withCheckCondition: `user_id = current_setting('app.current_user_id')::uuid`,
    roles: ['PUBLIC'],
    command: 'ALL',
    description: 'Permitir modificación solo de documentos propios'
  }
];

// Políticas RLS para la tabla de chunks de documentos
export const DOCUMENT_CHUNKS_RLS_POLICIES: RLSPolicy[] = [
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
    roles: ['PUBLIC'],
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
    roles: ['PUBLIC'],
    command: 'ALL',
    description: 'Permitir modificación solo de chunks de documentos propios'
  }
];

// Políticas RLS para la tabla de expedientes_clientes (relaciones)
export const EXPEDIENTE_CLIENT_RELATIONS_RLS_POLICIES: RLSPolicy[] = [
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
    roles: ['PUBLIC'],
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
    roles: ['PUBLIC'],
    command: 'ALL',
    description: 'Permitir modificación solo de relaciones expedientes-clientes de expedientes propios'
  }
];

// Políticas RLS para la tabla de expedientes_documentos (relaciones)
export const EXPEDIENTE_DOCUMENT_RELATIONS_RLS_POLICIES: RLSPolicy[] = [
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
    roles: ['PUBLIC'],
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
    roles: ['PUBLIC'],
    command: 'ALL',
    description: 'Permitir modificación solo de relaciones expedientes-documentos de expedientes propios'
  }
];

// Todas las políticas RLS
export const ALL_RLS_POLICIES: Record<string, RLSPolicy[]> = {
  'expedientes': EXPEDIENTE_RLS_POLICIES,
  'clientes': CLIENT_RLS_POLICIES,
  'documentos': DOCUMENT_RLS_POLICIES,
  'document_chunks': DOCUMENT_CHUNKS_RLS_POLICIES,
  'expedientes_clientes': EXPEDIENTE_CLIENT_RELATIONS_RLS_POLICIES,
  'expedientes_documentos': EXPEDIENTE_DOCUMENT_RELATIONS_RLS_POLICIES
};

// Generar SQL para crear o reemplazar una política RLS
export function generateCreateRLSPolicySQL(policy: RLSPolicy): string {
  let sql = `CREATE POLICY ${policy.policyName} ON ${policy.tableName} `;
  
  sql += `FOR ${policy.command} TO ${policy.roles.join(', ')} `;
  sql += `USING (${policy.usingCondition})`;
  
  if (policy.withCheckCondition) {
    sql += ` WITH CHECK (${policy.withCheckCondition})`;
  }
  
  return sql;
}

// Generar SQL para eliminar una política RLS existente
export function generateDropRLSPolicySQL(tableName: string, policyName: string): string {
  return `DROP POLICY IF EXISTS ${policyName} ON ${tableName}`;
}

// Generar SQL para habilitar RLS en una tabla
export function generateEnableRLSSQL(tableName: string): string {
  return `ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY`;
}

// Generar SQL para verificar si una tabla tiene RLS habilitado
export function generateCheckRLSEnabledSQL(tableName: string): string {
  return `SELECT relname, relrowsecurity FROM pg_class WHERE relname = '${tableName}' AND relrowsecurity = true`;
}

// Generar SQL para listar todas las políticas RLS aplicadas
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

// Aplicar todas las políticas RLS a la base de datos
export async function applyAllRLSPolicies(): Promise<boolean> {
  try {
    console.log('🚀 Iniciando aplicación de todas las políticas RLS...\n');
    
    const tables = Object.keys(ALL_RLS_POLICIES);
    console.log('⚙️  Habilitando RLS para todas las tablas...');
    
    for (const tableName of tables) {
      try {
        const enableSQL = generateEnableRLSSQL(tableName);
        await query(enableSQL);
        console.log(`✅ RLS habilitado para tabla: ${tableName}`);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.log(`⚠️  Error habilitando RLS para ${tableName}:`, err.message);
      }
    }
    
    console.log('\n📋 Aplicando políticas RLS para cada tabla...');
    
    for (const [tableName, policies] of Object.entries(ALL_RLS_POLICIES)) {
      console.log(`\n🔧 Configurando políticas para tabla: ${tableName}`);
      
      for (const policy of policies) {
        try {
          const dropSQL = generateDropRLSPolicySQL(tableName, policy.policyName);
          await query(dropSQL);
          
          const createSQL = generateCreateRLSPolicySQL(policy);
          await query(createSQL);
          console.log(`   ✅ Política creada: ${policy.policyName}`);
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          console.log(`   ❌ Error creando política ${policy.policyName}:`, err.message);
        }
      }
    }
    
    console.log('\n🔍 Verificando políticas RLS creadas...');
    const listSQL = generateListRLSPoliciesSQL();
    const result = await query(listSQL);
    
    if (result.rowCount && result.rowCount > 0) {
      console.log(`\n✅ Se encontraron ${result.rowCount} políticas RLS:`);
      result.rows.forEach(p => {
        console.log(`   • ${p.policy_name} en ${p.table_name} (${p.command})`);
      });
    } else {
      console.log('\n⚠️  No se encontraron políticas RLS después de la configuración');
    }
    
    console.log('\n🎉 Todas las políticas RLS han sido aplicadas exitosamente!');
    return true;    
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('\n❌ Error aplicando todas las políticas RLS:', err.message);
    return false;
  }
}

// Verificar políticas RLS específicas
export async function checkSpecificRLSPolicies(tableNames: string[]): Promise<any[]> {
  try {
    const policies: any[] = [];
    
    for (const tableName of tableNames) {
      const checkSQL = generateCheckRLSEnabledSQL(tableName);
      const result = await query(checkSQL);
      
      if (result.rowCount && result.rowCount > 0) {
        policies.push({
          table: tableName,
          rls_enabled: true,
          policies: ALL_RLS_POLICIES[tableName] || []
        });
      } else {
        policies.push({
          table: tableName,
          rls_enabled: false,
          policies: []
        });
      }
    }
    
    return policies;
  } catch (error) {
    console.error('Error checking specific RLS policies:', error);
    return [];
  }
}

// Probar políticas RLS con contexto de usuario
export async function testRLSPoliciesWithUserContext(userId: string): Promise<boolean> {
  try {
    // Establecer contexto de usuario
    await query(`SET app.current_user_id = '${userId}'`);
    console.log('✅ Contexto RLS establecido para usuario:', userId);
    
    const tablesToTest = ['expedientes', 'clientes', 'documentos'];
    
    for (const tableName of tablesToTest) {
      try {
        const result = await query(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`✅ Acceso a ${tableName} permitido: ${result.rows[0].count} registros`);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.log(`❌ Error accediendo a ${tableName}:`, err.message);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error testing RLS policies with user context:', error);
    return false;
  }
}
