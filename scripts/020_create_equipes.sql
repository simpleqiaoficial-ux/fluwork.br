-- Criar tabela de equipes
CREATE TABLE IF NOT EXISTS equipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  supervisor_id UUID REFERENCES colaboradores(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar campo equipe_id na tabela colaboradores
ALTER TABLE colaboradores 
ADD COLUMN IF NOT EXISTS equipe_id UUID REFERENCES equipes(id) ON DELETE SET NULL;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_colaboradores_equipe ON colaboradores(equipe_id);
CREATE INDEX IF NOT EXISTS idx_equipes_supervisor ON equipes(supervisor_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE equipes ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ver equipes
CREATE POLICY "Todos podem ver equipes" ON equipes
  FOR SELECT
  USING (true);

-- Política: Apenas Adm e Gerente podem criar/editar equipes
CREATE POLICY "Adm e Gerente podem gerenciar equipes" ON equipes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM colaboradores
      WHERE colaboradores.user_id = auth.uid()
      AND colaboradores.tipo_acesso IN ('Adm', 'Gerente')
    )
  );
