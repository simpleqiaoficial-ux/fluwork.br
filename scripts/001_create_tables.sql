-- Criar tabela de colaboradores
CREATE TABLE IF NOT EXISTS colaboradores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo TEXT NOT NULL,
  salario DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de pedidos de pagamento
CREATE TABLE IF NOT EXISTS pedidos_pagamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  horas_extras DECIMAL(5, 2) DEFAULT 0,
  valor_km DECIMAL(10, 2) DEFAULT 0,
  valor_total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_pedidos_colaborador ON pedidos_pagamento(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_created ON pedidos_pagamento(created_at DESC);
