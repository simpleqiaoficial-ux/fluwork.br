-- Adicionar campos de desconto na tabela pedidos_pagamento
ALTER TABLE pedidos_pagamento
ADD COLUMN IF NOT EXISTS valor_desconto NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS motivo_desconto TEXT;

-- Atualizar pedidos existentes para ter desconto 0
UPDATE pedidos_pagamento
SET valor_desconto = 0
WHERE valor_desconto IS NULL;
