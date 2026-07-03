-- Criar enum para tipos de acesso
CREATE TYPE tipo_acesso AS ENUM ('Colaborador', 'Supervisor', 'Gerente', 'Financeiro', 'Adm');

-- Adicionar coluna tipo_acesso à tabela colaboradores
ALTER TABLE colaboradores
ADD COLUMN IF NOT EXISTS tipo_acesso tipo_acesso DEFAULT 'Colaborador';

-- Criar índice para busca por tipo de acesso
CREATE INDEX IF NOT EXISTS idx_colaboradores_tipo_acesso ON colaboradores(tipo_acesso);
