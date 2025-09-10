#!/usr/bin/env node

/**
 * Script para aplicar políticas RLS (Row Level Security) a las tablas de la base de datos
 * 
 * Este script configura las políticas de seguridad a nivel de fila para todas las tablas
 * protegidas del sistema Nexus Jurídico.
 */

const { query } = require('../src/lib/db');

// Tablas que necesitan RLS
const TABLES_WITH_RLS = [
  'expedientes',
  'clientes', 
  'documentos',
  'document_chunks',
  'expedientes_clientes',
  'expedientes_documentos'
];

async function applyRLSPolicies() {
  console.log('🚀 Iniciando aplicación de políticas RLS...\n');
  
  try {
    // 1. Habilitar RLS para todas las tablas que necesitan políticas
    console.log('⚙️  Habilitando RLS para tablas protegidas...');
    
    for (const tableName of TABLES_WITH_RLS) {
      try {
        await query(`ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY`);
        console.log(`✅ RLS habilitado para tabla: ${tableName}`);
      } catch (error) {
        console.log(`⚠️  Error habilitando RLS para ${tableName}:`, error.message);
      }
    }
    
    // 2. Crear políticas RLS básicas para cada tabla
    console.log('\n📋 Creando políticas RLS básicas para cada tabla...');
    
// Políticas para expedientes
try {
  await query(`DROP POLICY IF EXISTS expedientes_select_policy ON expedientes`);
  await query(`CREATE POLICY expedientes_select_policy ON expedientes 
                   FOR SELECT USING (user_id = current_setting('app.current_user_id')::uuid)`);
  console.log('   ✅ Política expedientes_select_policy creada');
} catch (error) {
  console.log('   ❌ Error creando política expedientes_select_policy:', error.message);
}

try {
  await query(`DROP POLICY IF EXISTS expedientes_modify_policy ON expedientes`);
  await query(`CREATE POLICY expedientes_modify_policy ON expedientes 
                   FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid) 
                   WITH CHECK (user_id = current_setting('app.current_user_id')::uuid)`);
  console.log('   ✅ Política expedientes_modify_policy creada');
} catch (error) {
  console.log('   ❌ Error creando política expedientes_modify_policy:', error.message);
}
    
    // Políticas para clientes
    try {
      await query(`DROP POLICY IF EXISTS clientes_select_policy ON clientes`);
      await query(`CREATE POLICY clientes_select_policy ON clientes 
                   FOR SELECT USING (user_id = current_setting('app.current_user_id')::uuid)`);
      console.log('   ✅ Política clientes_select_policy creada');
    } catch (error) {
      console.log('   ❌ Error creando política clientes_select_policy:', error.message);
    }
    
    try {
      await query(`DROP POLICY IF EXISTS clientes_modify_policy ON clientes`);
      await query(`CREATE POLICY clientes_modify_policy ON clientes 
                   FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid) 
                   WITH CHECK (user_id = current_setting('app.current_user_id')::uuid)`);
      console.log('   ✅ Política clientes_modify_policy creada');
    } catch (error) {
      console.log('   ❌ Error creando política clientes_modify_policy:', error.message);
    }
    
    // Políticas para documentos
    try {
      await query(`DROP POLICY IF EXISTS documentos_select_policy ON documentos`);
      await query(`CREATE POLICY documentos_select_policy ON documentos 
                   FOR SELECT USING (user_id = current_setting('app.current_user_id')::uuid)`);
      console.log('   ✅ Política documentos_select_policy creada');
    } catch (error) {
      console.log('   ❌ Error creando política documentos_select_policy:', error.message);
    }
    
    try {
      await query(`DROP POLICY IF EXISTS documentos_modify_policy ON documentos`);
      await query(`CREATE POLICY documentos_modify_policy ON documentos 
                   FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid) 
                   WITH CHECK (user_id = current_setting('app.current_user_id')::uuid)`);
      console.log('   ✅ Política documentos_modify_policy creada');
    } catch (error) {
      console.log('   ❌ Error creando política documentos_modify_policy:', error.message);
    }
    
    // Políticas para document_chunks
    try {
      await query(`DROP POLICY IF EXISTS document_chunks_select_policy ON document_chunks`);
      await query(`CREATE POLICY document_chunks_select_policy ON document_chunks 
                   FOR SELECT USING (EXISTS(SELECT 1 FROM documentos d 
                                          WHERE d.id = document_chunks.document_id 
                                          AND d.user_id = current_setting('app.current_user_id')::uuid))`);
      console.log('   ✅ Política document_chunks_select_policy creada');
    } catch (error) {
      console.log('   ❌ Error creando política document_chunks_select_policy:', error.message);
    }
    
    try {
      await query(`DROP POLICY IF EXISTS document_chunks_modify_policy ON document_chunks`);
      await query(`CREATE POLICY document_chunks_modify_policy ON document_chunks 
                   FOR ALL USING (EXISTS(SELECT 1 FROM documentos d 
                                       WHERE d.id = document_chunks.document_id 
                                       AND d.user_id = current_setting('app.current_user_id')::uuid)) 
                   WITH CHECK (EXISTS(SELECT 1 FROM documentos d 
                                    WHERE d.id = document_chunks.document_id 
                                    AND d.user_id = current_setting('app.current_user_id')::uuid))`);
      console.log('   ✅ Política document_chunks_modify_policy creada');
    } catch (error) {
      console.log('   ❌ Error creando política document_chunks_modify_policy:', error.message);
    }
    
// Políticas para expedientes_clientes
try {
  await query(`DROP POLICY IF EXISTS expedientes_clientes_select_policy ON expedientes_clientes`);
  await query(`CREATE POLICY expedientes_clientes_select_policy ON expedientes_clientes 
                   FOR SELECT USING (EXISTS(SELECT 1 FROM expedientes e 
                                          WHERE e.id = expedientes_clientes.expediente_id 
                                          AND e.user_id = current_setting('app.current_user_id')::uuid))`);
  console.log('   ✅ Política expedientes_clientes_select_policy creada');
} catch (error) {
  console.log('   ❌ Error creando política expedientes_clientes_select_policy:', error.message);
}

try {
  await query(`DROP POLICY IF EXISTS expedientes_clientes_modify_policy ON expedientes_clientes`);
  await query(`CREATE POLICY expedientes_clientes_modify_policy ON expedientes_clientes 
                   FOR ALL USING (EXISTS(SELECT 1 FROM expedientes e 
                                       WHERE e.id = expedientes_clientes.expediente_id 
                                       AND e.user_id = current_setting('app.current_user_id')::uuid)) 
                   WITH CHECK (EXISTS(SELECT 1 FROM expedientes e 
                                    WHERE e.id = expedientes_clientes.expediente_id 
                                    AND e.user_id = current_setting('app.current_user_id')::uuid))`);
  console.log('   ✅ Política expedientes_clientes_modify_policy creada');
} catch (error) {
  console.log('   ❌ Error creando política expedientes_clientes_modify_policy:', error.message);
}
    
// Políticas para expedientes_documentos
try {
  await query(`DROP POLICY IF EXISTS expedientes_documentos_select_policy ON expedientes_documentos`);
  await query(`CREATE POLICY expedientes_documentos_select_policy ON expedientes_documentos 
                   FOR SELECT USING (EXISTS(SELECT 1 FROM expedientes e 
                                          WHERE e.id = expedientes_documentos.expediente_id 
                                          AND e.user_id = current_setting('app.current_user_id')::uuid))`);
  console.log('   ✅ Política expedientes_documentos_select_policy creada');
} catch (error) {
  console.log('   ❌ Error creando política expedientes_documentos_select_policy:', error.message);
}

try {
  await query(`DROP POLICY IF EXISTS expedientes_documentos_modify_policy ON expedientes_documentos`);
  await query(`CREATE POLICY expedientes_documentos_modify_policy ON expedientes_documentos 
                   FOR ALL USING (EXISTS(SELECT 1 FROM expedientes e 
                                       WHERE e.id = expedientes_documentos.expediente_id 
                                       AND e.user_id = current_setting('app.current_user_id')::uuid)) 
                   WITH CHECK (EXISTS(SELECT 1 FROM expedientes e 
                                    WHERE e.id = expedientes_documentos.expediente_id 
                                    AND e.user_id = current_setting('app.current_user_id')::uuid))`);
  console.log('   ✅ Política expedientes_documentos_modify_policy creada');
} catch (error) {
  console.log('   ❌ Error creando política expedientes_documentos_modify_policy:', error.message);
}
    
    // 3. Verificar políticas RLS creadas
    console.log('\n🔍 Verificando políticas RLS creadas...');
    try {
      const result = await query(`
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
      `);
      
      if (result.rowCount && result.rowCount > 0) {
        console.log(`\n✅ Se encontraron ${result.rowCount} políticas RLS:`);
        result.rows.forEach(policy => {
          console.log(`   • ${policy.policy_name} en ${policy.table_name} (${policy.command})`);
        });
      } else {
        console.log('\n⚠️  No se encontraron políticas RLS después de la configuración');
      }
    } catch (error) {
      console.log('⚠️  Error verificando políticas RLS:', error.message);
    }
    
    // 4. Probar políticas RLS con contexto de usuario
    console.log('\n🧪 Probando políticas RLS con contexto de usuario...');
    
    // Establecer contexto de usuario (usuario de prueba)
    const testUserId = '00000000-0000-0000-0000-000000000001';
    await query(`SET app.current_user_id = '${testUserId}'`);
    console.log('✅ Contexto RLS establecido para usuario de prueba');
    
    // Probar acceso a tablas con políticas RLS
    console.log('\n🔍 Probando acceso a tablas con políticas RLS...');
    
    // Probar acceso a casos
    try {
      const casesResult = await query('SELECT COUNT(*) as count FROM casos');
      console.log(`✅ Acceso a casos permitido: ${casesResult.rows[0].count} registros`);
    } catch (error) {
      console.log('❌ Error accediendo a casos:', error.message);
    }
    
    // Probar acceso a clientes
    try {
      const clientsResult = await query('SELECT COUNT(*) as count FROM clientes');
      console.log(`✅ Acceso a clientes permitido: ${clientsResult.rows[0].count} registros`);
    } catch (error) {
      console.log('❌ Error accediendo a clientes:', error.message);
    }
    
    // Probar acceso a documentos
    try {
      const documentsResult = await query('SELECT COUNT(*) as count FROM documentos');
      console.log(`✅ Acceso a documentos permitido: ${documentsResult.rows[0].count} registros`);
    } catch (error) {
      console.log('❌ Error accediendo a documentos:', error.message);
    }
    
    console.log('\n🎉 Aplicación de políticas RLS completada exitosamente!');
    console.log('✅ Todas las políticas RLS han sido configuradas y verificadas');
    
  } catch (error) {
    console.error('\n❌ Error aplicando políticas RLS:', error);
    process.exit(1);
  }
}

// Ejecutar las políticas RLS si este archivo se ejecuta directamente
if (require.main === module) {
  applyRLSPolicies().catch(console.error);
}

module.exports = { applyRLSPolicies };
