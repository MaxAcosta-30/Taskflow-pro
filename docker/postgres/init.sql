-- =============================================================
--  TaskFlow Pro — PostgreSQL Init Script
--  Se ejecuta solo la primera vez que se crea el contenedor
-- =============================================================

-- Extensiones útiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- Para búsqueda fuzzy
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- Para índices GIN

-- Las tablas las crea Prisma con migrate, este script solo
-- configura extensiones y settings del servidor.

-- Performance settings
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '768MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = '0.9';
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = '100';
