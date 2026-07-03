-- Adicionar coluna motivo_plantao na tabela pedidos_pagamento
ALTER TABLE pedidos_pagamento
ADD COLUMN IF NOT EXISTS motivo_plantao TEXT;

-- Comentário explicativo
COMMENT ON COLUMN pedidos_pagamento.motivo_plantao IS 'Motivo obrigatório quando há valor de plantão';
