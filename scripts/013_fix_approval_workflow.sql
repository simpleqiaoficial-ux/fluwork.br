-- Remover coluna que referencia auth.users (não usamos mais Supabase Auth)
ALTER TABLE pedidos_pagamento DROP COLUMN IF EXISTS criado_por;

-- Adicionar coluna para armazenar ID do colaborador que criou
ALTER TABLE pedidos_pagamento ADD COLUMN IF NOT EXISTS criado_por_colaborador_id UUID REFERENCES colaboradores(id);

-- Garantir que as colunas de status existem
ALTER TABLE pedidos_pagamento 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente_gerente' CHECK (status IN ('pendente_gerente', 'pendente_financeiro', 'aprovado', 'recusado', 'correcao'));

-- Adicionar colunas de observação se não existirem
ALTER TABLE pedidos_pagamento 
ADD COLUMN IF NOT EXISTS observacao_gerente TEXT,
ADD COLUMN IF NOT EXISTS observacao_financeiro TEXT,
ADD COLUMN IF NOT EXISTS data_aprovacao_gerente TIMESTAMP,
ADD COLUMN IF NOT EXISTS data_aprovacao_financeiro TIMESTAMP;

-- Atualizar pedidos existentes para ter status inicial
UPDATE pedidos_pagamento SET status = 'pendente_gerente' WHERE status IS NULL;

-- Criar índice para busca por status
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos_pagamento(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_colaborador ON pedidos_pagamento(colaborador_id);
