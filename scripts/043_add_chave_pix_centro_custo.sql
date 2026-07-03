-- Add chave_pix to colaboradores
ALTER TABLE colaboradores ADD COLUMN IF NOT EXISTS chave_pix TEXT;

-- Add centro_custo_id to colaboradores with FK
ALTER TABLE colaboradores ADD COLUMN IF NOT EXISTS centro_custo_id UUID REFERENCES centros_custo(id) ON DELETE SET NULL;
