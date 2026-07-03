-- Adiciona campo para armazenar URL da nota fiscal em PDF
ALTER TABLE pedidos_pagamento
ADD COLUMN IF NOT EXISTS nota_fiscal_url TEXT;

-- Adiciona comentário explicativo
COMMENT ON COLUMN pedidos_pagamento.nota_fiscal_url IS 'URL do arquivo PDF da nota fiscal emitida pelo colaborador';
