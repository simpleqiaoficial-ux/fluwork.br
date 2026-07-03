-- Adicionar novos campos à tabela de colaboradores
ALTER TABLE colaboradores
ADD COLUMN IF NOT EXISTS cnpj TEXT,
ADD COLUMN IF NOT EXISTS data_nascimento DATE,
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Criar índice para busca por email
CREATE INDEX IF NOT EXISTS idx_colaboradores_email ON colaboradores(email);
CREATE INDEX IF NOT EXISTS idx_colaboradores_user_id ON colaboradores(user_id);

-- Habilitar RLS (Row Level Security) nas tabelas
ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_pagamento ENABLE ROW LEVEL SECURITY;

-- Política para colaboradores verem apenas seus próprios dados
CREATE POLICY "Colaboradores podem ver seus próprios dados"
ON colaboradores
FOR SELECT
USING (auth.uid() = user_id);

-- Política para colaboradores verem apenas seus próprios pedidos
CREATE POLICY "Colaboradores podem ver seus próprios pedidos"
ON pedidos_pagamento
FOR SELECT
USING (
  colaborador_id IN (
    SELECT id FROM colaboradores WHERE user_id = auth.uid()
  )
);

-- Política para admins (service role) terem acesso total
CREATE POLICY "Service role tem acesso total aos colaboradores"
ON colaboradores
FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role tem acesso total aos pedidos"
ON pedidos_pagamento
FOR ALL
USING (auth.jwt()->>'role' = 'service_role');
