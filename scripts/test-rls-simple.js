#!/usr/bin/env node

/**
 * Script simple para probar las políticas RLS (Row Level Security)
 * 
 * Este script verifica que las políticas RLS estén correctamente configuradas.
 */

const { query } = require('../src/lib/db');

async function testSimpleRLS() {
  console.log('🚀 Iniciando prueba simple de políticas RLS...\n');
  
  try {
    // 1. Verificar políticas RLS existentes
    console.log('📋 Verificando políticas RLS existentes...');
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
      console.log(`✅ Se encontraron ${result.rowCount} políticas RLS:`);
      result.rows.forEach(policy => {
        console.log(`   • ${policy.policy_name} en ${policy.table_name} (${policy.command})`);
      });
    } else {
      console.log('⚠️  No se encontraron políticas RLS existentes');
    }
    
    // 2. Probar acceso a tablas con contexto RLS
    console.log('\n🧪 Probando acceso a tablas con contexto RLS...');
    
    // Establecer contexto de usuario (usuario de prueba)
    const testUserId = '00000000-0000-0000-0000-000000000001';
    await query(`SET app.current_user_id = '${testUserId}'`);
    console.log('✅ Contexto RLS establecido para usuario de prueba');
    
    // 3. Probar consultas básicas
    console.log('\n🔍 Probando consultas básicas...');
    
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
    
    console.log('\n🎉 Prueba simple de políticas RLS completada!');
    
  } catch (error) {
    console.error('\n❌ Error en la prueba de políticas RLS:', error);
    process.exit(1);
  }
}

// Ejecutar las pruebas si este archivo se ejecuta directamente
if (require.main === module) {
  testSimpleRLS().catch(console.error);
}

module.exports = { testSimpleRLS };
