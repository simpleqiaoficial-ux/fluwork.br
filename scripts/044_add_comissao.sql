-- Add comissao fields to pedidos_pagamento
ALTER TABLE pedidos_pagamento ADD COLUMN IF NOT EXISTS comissao NUMERIC DEFAULT 0;
ALTER TABLE pedidos_pagamento ADD COLUMN IF NOT EXISTS motivo_comissao TEXT;
