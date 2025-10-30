-- Fix AUTO_INCREMENT for consultores table
ALTER TABLE consultores MODIFY COLUMN id VARCHAR(36) NOT NULL;
ALTER TABLE consultores MODIFY COLUMN id VARCHAR(36) NOT NULL DEFAULT (UUID());

-- Add cpf column to indicadores if not exists
ALTER TABLE indicadores ADD COLUMN IF NOT EXISTS cpf VARCHAR(14);

-- Ensure id field has proper default for new inserts
ALTER TABLE consultores ALTER COLUMN id SET DEFAULT (UUID());
