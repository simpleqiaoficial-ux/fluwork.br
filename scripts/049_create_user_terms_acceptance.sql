-- Criar tabela para rastrear aceite de termos de uso
CREATE TABLE IF NOT EXISTS user_terms_acceptance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  version VARCHAR(20) NOT NULL,
  accepted BOOLEAN NOT NULL DEFAULT FALSE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  ip_address VARCHAR(45),
  device_info TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Não permitir duplicidade de aceite por versão para o mesmo usuário
  UNIQUE(user_id, version)
);

-- Criar índice para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_user_terms_user_id ON user_terms_acceptance(user_id);
CREATE INDEX IF NOT EXISTS idx_user_terms_version ON user_terms_acceptance(version);
CREATE INDEX IF NOT EXISTS idx_user_terms_accepted_at ON user_terms_acceptance(accepted_at);

-- Desabilitar RLS para permitir acesso via service role
ALTER TABLE user_terms_acceptance DISABLE ROW LEVEL SECURITY;
