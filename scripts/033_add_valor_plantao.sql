-- Adicionar coluna valor_plantao na tabela pedidos_pagamento
ALTER TABLE pedidos_pagamento
ADD COLUMN IF NOT EXISTS valor_plantao NUMERIC(10, 2) DEFAULT 0;

-- Atualizar pedidos existentes para ter valor_plantao = 0
UPDATE pedidos_pagamento
SET valor_plantao = 0
WHERE valor_plantao IS NULL;
