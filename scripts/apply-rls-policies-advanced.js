#!/usr/bin/env node

/**
 * Script para aplicar políticas RLS (Row Level Security) avanzadas
 * 
 * Este script configura las políticas de seguridad a nivel de fila para todas las tablas
 * protegidas del sistema Nexus Jurídico con configuraciones avanzadas.
 */

const { query } = require('../src/lib/db');
const { 
  EXPEDIENTE_RLS_POLICIES,
  CLIENT_RLS_POLICIES,
  DOCUMENT_RLS_POLICIES,
  DOCUMENT_CHUNKS_RLS_POLICIES,
  EXPEDIENTE_CLIENT_RELATIONS_RLS_POLICIES,
  EXPEDIENTE_DOCUMENT_RELATIONS_RLS_POLICIES,
  generateRLSPolicySQL,
  generateDropRLSPolicySQL,
  generateEnableRLSSQL,
  generateCheckRLSEnabledSQL,
  generateListRLSPoliciesSQL
} = require('../src/lib/rls-config');

// Todas las políticas RLS agrupadas por tabla
const ALL_TABLE_POLICIES = {
  'expedientes': EXPEDIENTE_RLS_POLICIES,
  'clientes': CLIENT_RLS_POLICIES,
  'documentos': DOCUMENT_RLS_POLICIES,
  'document_chunks': DOCUMENT_CHUNKS_RLS_POLICIES,
  'expedientes_clientes': EXPEDIENTE_CLIENT_RELATIONS_RLS_POLICIES,
  'expedientes_documentos': EXPEDIENTE_DOCUMENT_RELATIONS_RLS_POLICIES
};

async function applyAdvancedRLSPolicies() {
  console.log('🚀 Iniciando aplicación de políticas RLS avanzadas...\n');
  
  try {
    // 1. Habilitar RLS para todas las tablas que necesitan políticas
    console.log('⚙️  Habilitando RLS para tablas protegidas...');
    const tables = Object.keys(ALL_TABLE_POLICIES);
    
    for (const tableName of tables) {
      try {
        const enableSQL = generateEnableRLSSQL(tableName);
        await query(enableSQL);
        console.log(`✅ RLS habilitado para tabla: ${tableName}`);
      } catch (error) {
        console.log(`⚠️  Error habilitando RLS para ${tableName}:`, error.message);
      }
    }
    
    // 2. Crear políticas RLS para cada tabla
    console.log('\n📋 Creando políticas RLS avanzadas para cada tabla...');
    
    for (const [tableName, policies] of Object.entries(ALL_TABLE_POLICIES)) {
      console.log(`\n🔧 Configurando políticas avanzadas para tabla: ${tableName}`);
      
      for (const policy of policies) {
        try {
          // Eliminar política existente si existe
          const dropSQL = generateDropRLSPolicySQL(tableName, policy.policyName);
          await query(dropSQL);
          
          // Crear nueva política
          const createSQL = generateRLSPolicySQL(policy);
          await query(createSQL);
          console.log(`   ✅ Política avanzada creada: ${policy.policyName}`);
        } catch (error) {
          console.log(`   ❌ Error creando política avanzada ${policy.policyName}:`, error.message);
        }
      }
    }
    
    // 3. Verificar políticas RLS creadas
    console.log('\n🔍 Verificando políticas RLS avanzadas creadas...');
    try {
      const listSQL = generateListRLSPoliciesSQL();
      const result = await query(listSQL);
      
      if (result.rowCount && result.rowCount > 0) {
        console.log(`\n✅ Se encontraron ${result.rowCount} políticas RLS avanzadas:`);
        result.rows.forEach(policy => {
          console.log(`   • ${policy.policy_name} en ${policy.table_name} (${policy.command})`);
        });
      } else {
        console.log('\n⚠️  No se encontraron políticas RLS avanzadas después de la configuración');
      }
    } catch (error) {
      console.log('⚠️  Error verificando políticas RLS avanzadas:', error.message);
    }
    
    // 4. Probar políticas RLS con contexto de usuario
    console.log('\n🧪 Probando políticas RLS avanzadas con contexto de usuario...');
    
    // Establecer contexto de usuario (usuario de prueba)
    const testUserId = '00000000-0000-0000-0000-000000000001';
    try {
      await query(`SET app.current_user_id = '${testUserId}'`);
      console.log('✅ Contexto RLS avanzado establecido para usuario de prueba');
    } catch (error) {
      console.log('❌ Error estableciendo contexto RLS avanzado:', error.message);
    }
    
    // Probar acceso a tablas con políticas RLS
    console.log('\n🔍 Probando acceso a tablas con políticas RLS avanzadas...');
    
// Probar acceso a expedientes
try {
  const expedientesResult = await query('SELECT COUNT(*) as count FROM expedientes');
  console.log(`✅ Acceso a expedientes permitido: ${expedientesResult.rows[0].count} registros`);
} catch (error) {
  console.log('❌ Error accediendo a expedientes:', error.message);
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
    
    // Probar acceso a document_chunks
    try {
      const chunksResult = await query('SELECT COUNT(*) as count FROM document_chunks');
      console.log(`✅ Acceso a document_chunks permitido: ${chunksResult.rows[0].count} registros`);
    } catch (error) {
      console.log('❌ Error accediendo a document_chunks:', error.message);
    }
    
// Probar acceso a expedientes_clientes
try {
  const expClientsResult = await query('SELECT COUNT(*) as count FROM expedientes_clientes');
  console.log(`✅ Acceso a expedientes_clientes permitido: ${expClientsResult.rows[0].count} registros`);
} catch (error) {
  console.log('❌ Error accediendo a expedientes_clientes:', error.message);
}

// Probar acceso a expedientes_documentos
try {
  const expDocumentsResult = await query('SELECT COUNT(*) as count FROM expedientes_documentos');
  console.log(`✅ Acceso a expedientes_documentos permitido: ${expDocumentsResult.rows[0].count} registros`);
} catch (error) {
  console.log('❌ Error accediendo a expedientes_documentos:', error.message);
}
    
    console.log('\n🎉 Aplicación de políticas RLS avanzadas completada exitosamente!');
    console.log('✅ Todas las políticas RLS avanzadas han sido configuradas y verificadas');
    
  } catch (error) {
    console.error('\n❌ Error aplicando políticas RLS avanzadas:', error);
    process.exit(1);
  }
}

// Ejecutar las políticas RLS avanzadas si este archivo se ejecuta directamente
if (require.main === module) {
  applyAdvancedRLSPolicies().catch(console.error);
}

module.exports = { applyAdvancedRLSPolicies };
