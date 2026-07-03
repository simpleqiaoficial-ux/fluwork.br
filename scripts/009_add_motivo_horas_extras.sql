-- Adiciona coluna para armazenar o motivo das horas extras
ALTER TABLE pedidos_pagamento 
ADD COLUMN IF NOT EXISTS motivo_horas_extras TEXT;

COMMENT ON COLUMN pedidos_pagamento.motivo_horas_extras IS 'Justificativa para as horas extras realizadas';
