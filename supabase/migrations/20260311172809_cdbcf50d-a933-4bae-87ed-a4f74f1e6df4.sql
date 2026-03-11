
-- Enable required extensions for email queue infrastructure
CREATE EXTENSION IF NOT EXISTS pgmq CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_net CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_cron CASCADE;
