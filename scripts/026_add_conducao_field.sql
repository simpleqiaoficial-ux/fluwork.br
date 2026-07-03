-- Adiciona campo de condução na tabela pedidos_pagamento
ALTER TABLE pedidos_pagamento
ADD COLUMN conducao DECIMAL(10, 2) DEFAULT 0;

-- Atualiza pedidos existentes para ter condução = 0
UPDATE pedidos_pagamento
SET conducao = 0
WHERE conducao IS NULL;
