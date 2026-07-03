-- Tabela para controlar status do sistema (ligado/desligado)
CREATE TABLE IF NOT EXISTS system_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  suspended_reason TEXT,
  suspended_at TIMESTAMPTZ,
  suspended_by UUID REFERENCES colaboradores(id),
  reactivated_at TIMESTAMPTZ,
  reactivated_by UUID REFERENCES colaboradores(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir registro inicial (sistema ativo)
INSERT INTO system_status (is_active) 
VALUES (true)
ON CONFLICT DO NOTHING;

-- Apenas um registro deve existir
CREATE UNIQUE INDEX IF NOT EXISTS system_status_single_row ON system_status ((true));
