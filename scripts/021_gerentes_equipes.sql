-- Criar tabela de relacionamento entre gerentes e equipes
CREATE TABLE IF NOT EXISTS gerentes_equipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gerente_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  equipe_id UUID NOT NULL REFERENCES equipes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(gerente_id, equipe_id)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_gerentes_equipes_gerente ON gerentes_equipes(gerente_id);
CREATE INDEX IF NOT EXISTS idx_gerentes_equipes_equipe ON gerentes_equipes(equipe_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE gerentes_equipes ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ver relacionamentos gerente-equipe
CREATE POLICY "Todos podem ver gerentes_equipes" ON gerentes_equipes
  FOR SELECT
  USING (true);

-- Política: Apenas Adm pode gerenciar relacionamentos
CREATE POLICY "Apenas Adm pode gerenciar gerentes_equipes" ON gerentes_equipes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM colaboradores
      WHERE colaboradores.user_id = auth.uid()
      AND colaboradores.tipo_acesso = 'Adm'
    )
  );
