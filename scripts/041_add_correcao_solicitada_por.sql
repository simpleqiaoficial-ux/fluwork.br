-- Add column to track who requested the correction
ALTER TABLE pedidos_pagamento
ADD COLUMN IF NOT EXISTS correcao_solicitada_por TEXT;

-- Add a comment for documentation
COMMENT ON COLUMN pedidos_pagamento.correcao_solicitada_por IS 'Tracks who requested the correction: gerente or financeiro';
