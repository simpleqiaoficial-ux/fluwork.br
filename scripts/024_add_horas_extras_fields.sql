-- Adicionar campos separados para horas extras 50% e 100%
ALTER TABLE pedidos_pagamento 
  ADD COLUMN IF NOT EXISTS horas_extras_50 DECIMAL(5, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS horas_extras_100 DECIMAL(5, 2) DEFAULT 0;

-- Comentários explicativos
COMMENT ON COLUMN pedidos_pagamento.horas_extras_50 IS 'Quantidade de horas extras a 50% (valor hora normal × 1,5)';
COMMENT ON COLUMN pedidos_pagamento.horas_extras_100 IS 'Quantidade de horas extras a 100% (valor hora normal × 2)';
COMMENT ON COLUMN pedidos_pagamento.horas_extras IS 'Campo legado - será substituído pelos campos horas_extras_50 e horas_extras_100';
