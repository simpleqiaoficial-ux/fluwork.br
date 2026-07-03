-- Add deadline field for invoice attachment
ALTER TABLE pedidos_pagamento
ADD COLUMN IF NOT EXISTS data_limite_anexo_nota TIMESTAMP;

-- Update existing approved pedidos to set deadline (2 days from approval)
UPDATE pedidos_pagamento
SET data_limite_anexo_nota = data_aprovacao_financeiro + INTERVAL '2 days'
WHERE status = 'aprovado' 
  AND data_aprovacao_financeiro IS NOT NULL
  AND data_limite_anexo_nota IS NULL;
