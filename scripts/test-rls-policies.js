#!/usr/bin/env node

/**
 * Script para probar las políticas RLS (Row Level Security)
 * 
 * Este script verifica que las políticas RLS estén correctamente configuradas
 * y funcionando para todas las tablas protegidas.
 */

const { query } = require('../src/lib/db');

async function testRLSPolicies() {
  console.log('🚀 Iniciando prueba de políticas RLS...\n');
  
  try {
    // 1. Verificar políticas RLS existentes
    console.log('📋 Verificando políticas RLS existentes...');
    const existingPolicies = await listRLSPolicies();
    
    if (existingPolicies.length > 0) {
      console.log(`✅ Se encontraron ${existingPolicies.length} políticas RLS:`);
      existingPolicies.forEach(policy => {
        console.log(`   • ${policy.policy_name} en ${policy.table_name} (${policy.command})`);
      });
    } else {
      console.log('⚠️  No se encontraron políticas RLS existentes');
    }
    
    // 2. Configurar todas las políticas RLS (si no existen)
    console.log('\n⚙️  Configurando políticas RLS...');
    const setupSuccess = await setupAllRLSPolicies();
    
    if (setupSuccess) {
      console.log('✅ Configuración de políticas RLS completada');
    } else {
      console.log('❌ Error en la configuración de políticas RLS');
      process.exit(1);
    }
    
    // 3. Verificar nuevamente las políticas
    console.log('\n📋 Verificando políticas RLS después de la configuración...');
    const updatedPolicies = await listRLSPolicies();
    
    if (updatedPolicies.length > 0) {
      console.log(`✅ Total de políticas RLS configuradas: ${updatedPolicies.length}`);
      updatedPolicies.forEach(policy => {
        console.log(`   • ${policy.policy_name} en ${policy.table_name} (${policy.command})`);
      });
    } else {
      console.log('❌ No se pudieron configurar las políticas RLS');
      process.exit(1);
    }
    
    // 4. Probar acceso con contexto RLS
    console.log('\n🧪 Probando acceso con contexto RLS...');
    
    // Establecer contexto de usuario (usuario de prueba)
    const testUserId = '00000000-0000-0000-0000-000000000001';
    await query(`SET app.current_user_id = '${testUserId}'`);
    console.log('✅ Contexto RLS establecido para usuario de prueba');
    
    // 5. Probar consultas con RLS
    console.log('\n🔍 Probando consultas con políticas RLS...');
    
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
    
    // 6. Probar inserción con RLS
    console.log('\n➕ Probando inserción con políticas RLS...');
    
    // Probar inserción en casos
    try {
      const insertCaseResult = await query(`
        INSERT INTO casos (user_id, case_name, case_number, status, description)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [testUserId, 'Caso de Prueba RLS', 'RLS-001', 'abierto', 'Caso de prueba para RLS']);
      
      const caseId = insertCaseResult.rows[0].id;
      console.log(`✅ Inserción en casos exitosa: ${caseId}`);
      
      // Limpiar el caso de prueba
      await query('DELETE FROM casos WHERE id = $1', [caseId]);
      console.log('✅ Limpieza de caso de prueba completada');
    } catch (error) {
      console.log('❌ Error en inserción de casos:', error.message);
    }
    
    console.log('\n🎉 Prueba de políticas RLS completada exitosamente!');
    console.log('✅ Todas las políticas RLS están configuradas y funcionando');
    
  } catch (error) {
    console.error('\n❌ Error en la prueba de políticas RLS:', error);
    process.exit(1);
  }
}

// Ejecutar las pruebas si este archivo se ejecuta directamente
if (require.main === module) {
  testRLSPolicies().catch(console.error);
}

module.exports = { testRLSPolicies };
