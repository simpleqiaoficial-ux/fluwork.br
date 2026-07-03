-- Adicionar campo para rastrear se a nota foi emitida
ALTER TABLE pedidos_pagamento
ADD COLUMN nota_emitida BOOLEAN DEFAULT FALSE,
ADD COLUMN data_emissao_nota TIMESTAMP WITH TIME ZONE;

-- Adicionar comentários
COMMENT ON COLUMN pedidos_pagamento.nota_emitida IS 'Indica se o colaborador já emitiu a nota fiscal';
COMMENT ON COLUMN pedidos_pagamento.data_emissao_nota IS 'Data em que a nota fiscal foi emitida';
