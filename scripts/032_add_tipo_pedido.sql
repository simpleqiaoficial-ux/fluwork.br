-- Adicionar coluna tipo_pedido na tabela pedidos_pagamento
ALTER TABLE pedidos_pagamento
ADD COLUMN IF NOT EXISTS tipo_pedido TEXT DEFAULT 'completo' CHECK (tipo_pedido IN ('completo', 'reembolso_km'));

-- Atualizar pedidos existentes para tipo 'completo'
UPDATE pedidos_pagamento
SET tipo_pedido = 'completo'
WHERE tipo_pedido IS NULL;
