#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const LOGS_DIR = path.join(process.cwd(), 'logs');
const ARCHIVE_DIR = path.join(LOGS_DIR, 'archive');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Crear directorios si no existen
async function ensureDirectories() {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
    log('✅ Directorio de logs creado', 'green');
  }
  if (!fs.existsSync(ARCHIVE_DIR)) {
    fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
    log('✅ Directorio de archivo creado', 'green');
  }
}

// Obtener tamaño de archivo en formato legible
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Listar todos los logs
async function listLogs() {
  await ensureDirectories();
  
  log('\n📊 LOGS ACTUALES\n', 'bright');
  
  try {
    const files = await readdir(LOGS_DIR);
    const logFiles = files.filter(file => file.endsWith('.log'));
    
    if (logFiles.length === 0) {
      log('No hay archivos de log actualmente', 'yellow');
      return;
    }
    
    let totalSize = 0;
    log('Archivo                          Tamaño      Última modificación', 'cyan');
    log('-'.repeat(70), 'cyan');
    
    for (const file of logFiles) {
      const filePath = path.join(LOGS_DIR, file);
      const stats = await stat(filePath);
      totalSize += stats.size;
      
      const modTime = stats.mtime.toLocaleString('es-ES');
      const size = formatBytes(stats.size);
      
      console.log(`${file.padEnd(30)} ${size.padEnd(12)} ${modTime}`);
    }
    
    log('-'.repeat(70), 'cyan');
    log(`Total: ${logFiles.length} archivos, ${formatBytes(totalSize)}`, 'green');
    
    // Verificar archivos archivados
    const archiveFiles = fs.existsSync(ARCHIVE_DIR) ? 
      (await readdir(ARCHIVE_DIR)).filter(file => file.endsWith('.log')) : [];
    
    if (archiveFiles.length > 0) {
      log(`\n📦 Archivos archivados: ${archiveFiles.length}`, 'blue');
    }
    
  } catch (error) {
    log(`Error al listar logs: ${error.message}`, 'red');
  }
}

// Ver contenido de un log
async function viewLog(filename, lines = 50) {
  const filePath = path.join(LOGS_DIR, filename);
  
  if (!fs.existsSync(filePath)) {
    log(`❌ Archivo no encontrado: ${filename}`, 'red');
    return;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const allLines = content.split('\n');
    const lastLines = allLines.slice(-lines);
    
    log(`\n📄 Últimas ${lines} líneas de ${filename}:\n`, 'bright');
    console.log(lastLines.join('\n'));
    
  } catch (error) {
    log(`Error al leer el archivo: ${error.message}`, 'red');
  }
}

// Limpiar logs antiguos
async function cleanOldLogs(daysToKeep = 30) {
  await ensureDirectories();
  
  const now = Date.now();
  const maxAge = daysToKeep * 24 * 60 * 60 * 1000;
  
  log(`\n🧹 Limpiando logs más antiguos de ${daysToKeep} días...\n`, 'bright');
  
  let deletedCount = 0;
  let deletedSize = 0;
  
  // Limpiar logs principales
  const files = await readdir(LOGS_DIR);
  for (const file of files.filter(f => f.endsWith('.log'))) {
    const filePath = path.join(LOGS_DIR, file);
    const stats = await stat(filePath);
    
    if (now - stats.mtime.getTime() > maxAge) {
      deletedSize += stats.size;
      fs.unlinkSync(filePath);
      log(`❌ Eliminado: ${file} (${formatBytes(stats.size)})`, 'yellow');
      deletedCount++;
    }
  }
  
  // Limpiar archivos archivados
  if (fs.existsSync(ARCHIVE_DIR)) {
    const archiveFiles = await readdir(ARCHIVE_DIR);
    for (const file of archiveFiles.filter(f => f.endsWith('.log'))) {
      const filePath = path.join(ARCHIVE_DIR, file);
      const stats = await stat(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        deletedSize += stats.size;
        fs.unlinkSync(filePath);
        log(`❌ Eliminado del archivo: ${file}`, 'yellow');
        deletedCount++;
      }
    }
  }
  
  if (deletedCount > 0) {
    log(`\n✅ Eliminados ${deletedCount} archivos (${formatBytes(deletedSize)} liberados)`, 'green');
  } else {
    log('✅ No hay logs antiguos para eliminar', 'green');
  }
}

// Rotar logs del día actual
async function rotateLogs() {
  await ensureDirectories();
  
  log('\n🔄 Rotando logs...\n', 'bright');
  
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const files = await readdir(LOGS_DIR);
  const logsToRotate = files.filter(file => 
    file.endsWith('.log') && !file.includes(todayStr)
  );
  
  if (logsToRotate.length === 0) {
    log('No hay logs para rotar', 'yellow');
    return;
  }
  
  for (const file of logsToRotate) {
    const oldPath = path.join(LOGS_DIR, file);
    const newPath = path.join(ARCHIVE_DIR, file);
    
    fs.renameSync(oldPath, newPath);
    log(`📦 Archivado: ${file}`, 'green');
  }
  
  log(`\n✅ ${logsToRotate.length} archivos rotados`, 'green');
}

// Estadísticas de logs
async function showStats() {
  await ensureDirectories();
  
  log('\n📈 ESTADÍSTICAS DE LOGS\n', 'bright');
  
  const files = await readdir(LOGS_DIR);
  const logFiles = files.filter(file => file.endsWith('.log'));
  
  let stats = {
    totalFiles: logFiles.length,
    totalSize: 0,
    byType: {},
    oldestFile: null,
    newestFile: null,
    oldestDate: new Date(),
    newestDate: new Date(0),
  };
  
  for (const file of logFiles) {
    const filePath = path.join(LOGS_DIR, file);
    const fileStats = await stat(filePath);
    stats.totalSize += fileStats.size;
    
    // Tipo de log
    const type = file.split('-')[0];
    if (!stats.byType[type]) {
      stats.byType[type] = { count: 0, size: 0 };
    }
    stats.byType[type].count++;
    stats.byType[type].size += fileStats.size;
    
    // Fechas
    if (fileStats.mtime < stats.oldestDate) {
      stats.oldestDate = fileStats.mtime;
      stats.oldestFile = file;
    }
    if (fileStats.mtime > stats.newestDate) {
      stats.newestDate = fileStats.mtime;
      stats.newestFile = file;
    }
  }
  
  // Mostrar estadísticas
  log('📊 Resumen General:', 'cyan');
  console.log(`  Total de archivos: ${stats.totalFiles}`);
  console.log(`  Tamaño total: ${formatBytes(stats.totalSize)}`);
  
  if (stats.totalFiles > 0) {
    console.log(`  Archivo más antiguo: ${stats.oldestFile} (${stats.oldestDate.toLocaleDateString()})`);
    console.log(`  Archivo más reciente: ${stats.newestFile} (${stats.newestDate.toLocaleDateString()})`);
    
    log('\n📊 Por tipo de log:', 'cyan');
    for (const [type, data] of Object.entries(stats.byType)) {
      console.log(`  ${type}: ${data.count} archivos, ${formatBytes(data.size)}`);
    }
  }
  
  // Archivos archivados
  if (fs.existsSync(ARCHIVE_DIR)) {
    const archiveFiles = await readdir(ARCHIVE_DIR);
    const archiveLogs = archiveFiles.filter(file => file.endsWith('.log'));
    if (archiveLogs.length > 0) {
      let archiveSize = 0;
      for (const file of archiveLogs) {
        const fileStats = await stat(path.join(ARCHIVE_DIR, file));
        archiveSize += fileStats.size;
      }
      log('\n📦 Archivos archivados:', 'cyan');
      console.log(`  Total: ${archiveLogs.length} archivos, ${formatBytes(archiveSize)}`);
    }
  }
}

// Menú principal
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.clear();
  log('\n🔍 GESTOR DE LOGS - CAPITOLIO CONSULTORES\n', 'bright');
  
  switch (command) {
    case 'list':
      await listLogs();
      break;
      
    case 'view':
      const filename = args[1];
      const lines = parseInt(args[2]) || 50;
      if (!filename) {
        log('❌ Especifica el archivo a ver: node scripts/manage-logs.js view combined-2025-09-15.log', 'red');
      } else {
        await viewLog(filename, lines);
      }
      break;
      
    case 'clean':
      const days = parseInt(args[1]) || 30;
      await cleanOldLogs(days);
      break;
      
    case 'rotate':
      await rotateLogs();
      break;
      
    case 'stats':
      await showStats();
      break;
      
    default:
      log('Comandos disponibles:\n', 'yellow');
      console.log('  node scripts/manage-logs.js list              - Listar todos los logs');
      console.log('  node scripts/manage-logs.js view <archivo>    - Ver contenido de un log');
      console.log('  node scripts/manage-logs.js stats             - Ver estadísticas');
      console.log('  node scripts/manage-logs.js rotate            - Rotar logs antiguos');
      console.log('  node scripts/manage-logs.js clean [días]      - Limpiar logs antiguos');
      console.log('\nEjemplos:');
      console.log('  node scripts/manage-logs.js view combined-2025-09-15.log');
      console.log('  node scripts/manage-logs.js clean 7');
  }
  
  console.log('');
}

// Ejecutar
main().catch(error => {
  log(`\n❌ Error: ${error.message}`, 'red');
  process.exit(1);
});
