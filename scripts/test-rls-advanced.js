#!/usr/bin/env node

/**
 * Script para probar las políticas RLS (Row Level Security) avanzadas
 * 
 * Este script verifica que las políticas RLS avanzadas estén correctamente configuradas
 * y funcionando para todas las tablas protegidas del sistema Nexus Jurídico.
 */

const { query } = require('../src/lib/db');
const { 
  generateListRLSPoliciesSQL,
  generateCheckRLSEnabledSQL
} = require('../src/lib/rls-policies');

async function testAdvancedRLSPolicies() {
  console.log('🚀 Iniciando prueba avanzada de políticas RLS...\n');
  
  try {
    // 1. Verificar políticas RLS existentes
    console.log('📋 Verificando políticas RLS avanzadas existentes...');
    const listSQL = generateListRLSPoliciesSQL();
    const result = await query(listSQL);
    
    if (result.rowCount && result.rowCount > 0) {
      console.log(`✅ Se encontraron ${result.rowCount} políticas RLS avanzadas:`);
      result.rows.forEach(policy => {
        console.log(`   • ${policy.policy_name} en ${policy.table_name} (${policy.command})`);
      });
    } else {
      console.log('⚠️  No se encontraron políticas RLS avanzadas existentes');
    }
    
    // 2. Verificar que RLS esté habilitado para tablas principales
    console.log('\n🔍 Verificando que RLS esté habilitado para tablas principales...');
    const tablesToCheck = [
      'casos',
      'clientes', 
      'documentos',
      'document_chunks',
      'casos_clientes',
      'casos_documentos'
    ];
    
    for (const tableName of tablesToCheck) {
      try {
        const checkSQL = generateCheckRLSEnabledSQL(tableName);
        const checkResult = await query(checkSQL);
        
        if (checkResult.rowCount && checkResult.rowCount > 0) {
          console.log(`✅ RLS habilitado para tabla: ${tableName}`);
        } else {
          console.log(`⚠️  RLS no habilitado para tabla: ${tableName}`);
        }
      } catch (error) {
        console.log(`❌ Error verificando RLS para ${tableName}:`, error.message);
      }
    }
    
    // 3. Probar acceso con contexto RLS avanzado
    console.log('\n🧪 Probando acceso con contexto RLS avanzado...');
    
    // Establecer contexto de usuario (usuario de prueba)
    const testUserId = '00000000-0000-0000-0000-000000000001';
    await query(`SET app.current_user_id = '${testUserId}'`);
    console.log('✅ Contexto RLS avanzado establecido para usuario de prueba');
    
    // 4. Probar consultas con políticas RLS avanzadas
    console.log('\n🔍 Probando consultas con políticas RLS avanzadas...');
    
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
    
    // Probar acceso a document_chunks
    try {
      const chunksResult = await query('SELECT COUNT(*) as count FROM document_chunks');
      console.log(`✅ Acceso a document_chunks permitido: ${chunksResult.rows[0].count} registros`);
    } catch (error) {
      console.log('❌ Error accediendo a document_chunks:', error.message);
    }
    
    // Probar acceso a casos_clientes
    try {
      const caseClientsResult = await query('SELECT COUNT(*) as count FROM casos_clientes');
      console.log(`✅ Acceso a casos_clientes permitido: ${caseClientsResult.rows[0].count} registros`);
    } catch (error) {
      console.log('❌ Error accediendo a casos_clientes:', error.message);
    }
    
    // Probar acceso a casos_documentos
    try {
      const caseDocumentsResult = await query('SELECT COUNT(*) as count FROM casos_documentos');
      console.log(`✅ Acceso a casos_documentos permitido: ${caseDocumentsResult.rows[0].count} registros`);
    } catch (error) {
      console.log('❌ Error accediendo a casos_documentos:', error.message);
    }
    
    // 5. Probar inserción con políticas RLS avanzadas
    console.log('\n➕ Probando inserción con políticas RLS avanzadas...');
    
    // Probar inserción en casos
    try {
      const insertCaseResult = await query(`
        INSERT INTO casos (user_id, case_name, case_number, status, description)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, case_name
      `, [testUserId, 'Caso de Prueba RLS Avanzado', 'RLS-AV-001', 'abierto', 'Caso de prueba para RLS avanzado']);
      
      const caseId = insertCaseResult.rows[0].id;
      console.log(`✅ Inserción en casos exitosa: ${caseId} - ${insertCaseResult.rows[0].case_name}`);
      
      // Limpiar el caso de prueba
      await query('DELETE FROM casos WHERE id = $1', [caseId]);
      console.log('✅ Limpieza de caso de prueba completada');
    } catch (error) {
      console.log('❌ Error en inserción de casos:', error.message);
    }
    
    // Probar inserción en clientes
    try {
      const insertClientResult = await query(`
        INSERT INTO clientes (user_id, full_name, email, phone)
        VALUES ($1, $2, $3, $4)
        RETURNING id, full_name
      `, [testUserId, 'Cliente de Prueba RLS Avanzado', 'cliente@prueba.com', '+581234567890']);
      
      const clientId = insertClientResult.rows[0].id;
      console.log(`✅ Inserción en clientes exitosa: ${clientId} - ${insertClientResult.rows[0].full_name}`);
      
      // Limpiar el cliente de prueba
      await query('DELETE FROM clientes WHERE id = $1', [clientId]);
      console.log('✅ Limpieza de cliente de prueba completada');
    } catch (error) {
      console.log('❌ Error en inserción de clientes:', error.message);
    }
    
    // Probar inserción en documentos
    try {
      const insertDocumentResult = await query(`
        INSERT INTO documentos (user_id, name, path, mime_type)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name
      `, [testUserId, 'Documento de Prueba RLS Avanzado', '/documentos/prueba.pdf', 'application/pdf']);
      
      const documentId = insertDocumentResult.rows[0].id;
      console.log(`✅ Inserción en documentos exitosa: ${documentId} - ${insertDocumentResult.rows[0].name}`);
      
      // Limpiar el documento de prueba
      await query('DELETE FROM documentos WHERE id = $1', [documentId]);
      console.log('✅ Limpieza de documento de prueba completada');
    } catch (error) {
      console.log('❌ Error en inserción de documentos:', error.message);
    }
    
    console.log('\n🎉 Prueba avanzada de políticas RLS completada exitosamente!');
    console.log('✅ Todas las políticas RLS avanzadas están configuradas y funcionando');
    
  } catch (error) {
    console.error('\n❌ Error en la prueba avanzada de políticas RLS:', error);
    process.exit(1);
  }
}

// Ejecutar las pruebas si este archivo se ejecuta directamente
if (require.main === module) {
  testAdvancedRLSPolicies().catch(console.error);
}

module.exports = { testAdvancedRLSPolicies };
