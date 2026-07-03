-- Adicionar campos de status e aprovação aos pedidos
ALTER TABLE pedidos_pagamento
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente_gerente' CHECK (status IN ('pendente_gerente', 'pendente_financeiro', 'aprovado', 'recusado', 'correcao')),
ADD COLUMN IF NOT EXISTS aprovado_gerente BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS aprovado_financeiro BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS observacao_gerente TEXT,
ADD COLUMN IF NOT EXISTS observacao_financeiro TEXT,
ADD COLUMN IF NOT EXISTS data_aprovacao_gerente TIMESTAMP,
ADD COLUMN IF NOT EXISTS data_aprovacao_financeiro TIMESTAMP,
ADD COLUMN IF NOT EXISTS criado_por UUID REFERENCES auth.users(id);

-- Criar índice para busca por status
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos_pagamento(status);
