-- Add tipo_chave_pix column to colaboradores table
ALTER TABLE colaboradores ADD COLUMN IF NOT EXISTS tipo_chave_pix text;
