-- Renombrar la tabla principal
ALTER TABLE "casos" RENAME TO "expedientes";

-- Renombrar tablas de relaciones
ALTER TABLE "casos_clientes" RENAME TO "expedientes_clientes";
ALTER TABLE "casos_documentos" RENAME TO "expedientes_documentos";

-- Renombrar columnas en la tabla principal 'expedientes'
ALTER TABLE "expedientes" RENAME COLUMN "case_name" TO "expediente_name";
ALTER TABLE "expedientes" RENAME COLUMN "case_number" TO "expediente_number";

-- Renombrar columnas de clave foránea en las tablas de relaciones
ALTER TABLE "expedientes_clientes" RENAME COLUMN "caso_id" TO "expediente_id";
ALTER TABLE "expedientes_documentos" RENAME COLUMN "caso_id" TO "expediente_id";

-- Actualizar secuencias y constraints si es necesario (PostgreSQL a menudo lo hace automáticamente, pero es bueno verificar)
-- Nota: Los nombres de los índices y claves foráneas pueden haber sido generados automáticamente.
-- Esta sección puede necesitar ajuste si los nombres son diferentes en tu esquema.

-- Renombrar clave primaria si tiene un nombre específico (ej. 'casos_pkey')
ALTER INDEX "casos_pkey" RENAME TO "expedientes_pkey";

-- Renombrar claves foráneas y sus índices asociados
ALTER INDEX "casos_clientes_caso_id_idx" RENAME TO "expedientes_clientes_expediente_id_idx";
ALTER TABLE "expedientes_clientes" RENAME CONSTRAINT "casos_clientes_caso_id_fkey" TO "expedientes_clientes_expediente_id_fkey";

ALTER INDEX "casos_documentos_caso_id_idx" RENAME TO "expedientes_documentos_expediente_id_idx";
ALTER TABLE "expedientes_documentos" RENAME CONSTRAINT "casos_documentos_caso_id_fkey" TO "expedientes_documentos_expediente_id_fkey";

-- Renombrar la política RLS en la tabla 'expedientes'
ALTER POLICY "casos_select_policy" ON "expedientes" RENAME TO "expedientes_select_policy";
ALTER POLICY "casos_modify_policy" ON "expedientes" RENAME TO "expedientes_modify_policy";

-- Renombrar las políticas RLS en las tablas de relaciones
ALTER POLICY "casos_clientes_select_policy" ON "expedientes_clientes" RENAME TO "expedientes_clientes_select_policy";
ALTER POLICY "casos_clientes_modify_policy" ON "expedientes_clientes" RENAME TO "expedientes_clientes_modify_policy";

ALTER POLICY "casos_documentos_select_policy" ON "expedientes_documentos" RENAME TO "expedientes_documentos_select_policy";
ALTER POLICY "casos_documentos_modify_policy" ON "expedientes_documentos" RENAME TO "expedientes_documentos_modify_policy";
