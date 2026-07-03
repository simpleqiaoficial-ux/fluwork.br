-- Script de melhorias de segurança
-- Este script não modifica senhas, apenas adiciona índices e constraints

-- Adicionar índice para email (melhora performance de login)
CREATE INDEX IF NOT EXISTS idx_colaboradores_email ON colaboradores(email);

-- Adicionar índice para equipes (melhora queries de hierarquia)
CREATE INDEX IF NOT EXISTS idx_colaboradores_equipe ON colaboradores(equipe_id);
CREATE INDEX IF NOT EXISTS idx_gerentes_equipes_gerente ON gerentes_equipes(gerente_id);
CREATE INDEX IF NOT EXISTS idx_gerentes_equipes_equipe ON gerentes_equipes(equipe_id);

-- Adicionar constraint para email único
ALTER TABLE colaboradores 
ADD CONSTRAINT unique_email UNIQUE (email);

-- Comentários de documentação
COMMENT ON COLUMN colaboradores.senha_hash IS 'Senha hasheada com bcrypt (salt 10). Nunca armazenar em texto plano.';
COMMENT ON COLUMN colaboradores.email IS 'Email único do colaborador. Usado para login.';
COMMENT ON COLUMN colaboradores.tipo_acesso IS 'Tipo de acesso: Admin, Financeiro, Gerente, Supervisor, Colaborador';

-- Criar função para log de auditoria (opcional, para implementação futura)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID REFERENCES colaboradores(id),
  acao TEXT NOT NULL,
  tabela TEXT,
  registro_id TEXT,
  detalhes JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_colaborador ON audit_log(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);

COMMENT ON TABLE audit_log IS 'Log de auditoria de ações críticas no sistema. Implementação futura.';
