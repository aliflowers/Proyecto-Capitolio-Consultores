#!/usr/bin/env node

/**
 * Script para inicializar la tabla de auditoría
 * Este script crea la tabla audit_logs en la base de datos si no existe
 */

const { initializeAuditTable } = require('../src/lib/audit-logger');

async function initAuditTable() {
  console.log('🚀 Iniciando inicialización de tabla de auditoría...');
  
  try {
    await initializeAuditTable();
    console.log('✅ Tabla de auditoría inicializada exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al inicializar la tabla de auditoría:', error);
    process.exit(1);
  }
}

// Ejecutar si este archivo se llama directamente
if (require.main === module) {
  initAuditTable();
}

module.exports = initAuditTable;
