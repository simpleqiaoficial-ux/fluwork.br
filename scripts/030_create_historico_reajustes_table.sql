-- Criar tabela de histórico de reajustes
CREATE TABLE IF NOT EXISTS historico_reajustes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  salario_anterior NUMERIC(10, 2) NOT NULL,
  salario_novo NUMERIC(10, 2) NOT NULL,
  tipo_reajuste TEXT NOT NULL CHECK (tipo_reajuste IN ('porcentagem', 'valor')),
  valor_reajuste NUMERIC(10, 2) NOT NULL,
  motivo TEXT NOT NULL,
  aplicado_por_id UUID NOT NULL REFERENCES colaboradores(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Desabilitar RLS para evitar problemas
ALTER TABLE historico_reajustes DISABLE ROW LEVEL SECURITY;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_historico_reajustes_colaborador ON historico_reajustes(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_historico_reajustes_created_at ON historico_reajustes(created_at DESC);
