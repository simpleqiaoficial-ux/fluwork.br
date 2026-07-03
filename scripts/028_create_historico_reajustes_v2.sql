-- Criar tabela de histórico de reajustes salariais
CREATE TABLE IF NOT EXISTS historico_reajustes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  salario_anterior DECIMAL(10, 2) NOT NULL,
  salario_novo DECIMAL(10, 2) NOT NULL,
  tipo_reajuste VARCHAR(20) NOT NULL CHECK (tipo_reajuste IN ('porcentagem', 'valor')),
  valor_reajuste DECIMAL(10, 2) NOT NULL,
  motivo TEXT,
  aplicado_por UUID NOT NULL REFERENCES colaboradores(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_historico_reajustes_colaborador ON historico_reajustes(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_historico_reajustes_aplicado_por ON historico_reajustes(aplicado_por);
CREATE INDEX IF NOT EXISTS idx_historico_reajustes_created_at ON historico_reajustes(created_at DESC);

-- Desabilitar RLS para permitir operações
ALTER TABLE historico_reajustes DISABLE ROW LEVEL SECURITY;
