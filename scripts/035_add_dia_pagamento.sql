-- Adiciona coluna dia_pagamento na tabela colaboradores
ALTER TABLE colaboradores
ADD COLUMN IF NOT EXISTS dia_pagamento INTEGER DEFAULT 1 CHECK (dia_pagamento IN (1, 15));

-- Comentário explicativo
COMMENT ON COLUMN colaboradores.dia_pagamento IS 'Dia do mês em que o colaborador recebe pagamento: 1 ou 15';
