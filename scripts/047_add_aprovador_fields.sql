-- Adiciona campos para rastrear quem aprovou cada etapa e quando
-- Isso permite auditoria completa do fluxo de aprovação

-- Campo para armazenar quem aprovou como gerente
ALTER TABLE pedidos_pagamento 
ADD COLUMN IF NOT EXISTS aprovado_por_gerente_id uuid REFERENCES colaboradores(id);

-- Campo para armazenar quem aprovou como financeiro  
ALTER TABLE pedidos_pagamento 
ADD COLUMN IF NOT EXISTS aprovado_por_financeiro_id uuid REFERENCES colaboradores(id);

-- Campo para armazenar quando a nota foi recebida pelo financeiro
ALTER TABLE pedidos_pagamento 
ADD COLUMN IF NOT EXISTS data_nota_recebida timestamp with time zone;

-- Índices para melhorar performance das consultas
CREATE INDEX IF NOT EXISTS idx_pedidos_aprovado_por_gerente ON pedidos_pagamento(aprovado_por_gerente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_aprovado_por_financeiro ON pedidos_pagamento(aprovado_por_financeiro_id);
