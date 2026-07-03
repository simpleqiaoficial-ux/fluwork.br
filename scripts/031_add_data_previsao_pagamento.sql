-- Adicionar coluna de data de previsão de pagamento
ALTER TABLE pedidos_pagamento
ADD COLUMN IF NOT EXISTS data_previsao_pagamento DATE;

-- Comentário explicativo
COMMENT ON COLUMN pedidos_pagamento.data_previsao_pagamento IS 'Data prevista para pagamento, definida pelo financeiro ao aprovar';
