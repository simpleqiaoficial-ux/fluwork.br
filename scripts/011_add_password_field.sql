-- Adicionar campo de senha na tabela colaboradores para autenticação customizada
ALTER TABLE colaboradores
ADD COLUMN IF NOT EXISTS senha_hash TEXT;

-- Remover a constraint de user_id obrigatório, pois agora será criado apenas no primeiro login
ALTER TABLE colaboradores
ALTER COLUMN user_id DROP NOT NULL;
