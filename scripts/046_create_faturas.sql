-- Criar tabela de faturas
CREATE TABLE IF NOT EXISTS faturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  valor NUMERIC(15, 2),
  data_vencimento DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido')),
  arquivo_pdf_url TEXT NOT NULL,
  criado_por UUID REFERENCES colaboradores(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de relacionamento faturas <-> colaboradores (quem pode ver)
CREATE TABLE IF NOT EXISTS faturas_colaboradores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fatura_id UUID NOT NULL REFERENCES faturas(id) ON DELETE CASCADE,
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  visualizado BOOLEAN DEFAULT FALSE,
  data_visualizacao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(fatura_id, colaborador_id)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_faturas_status ON faturas(status);
CREATE INDEX IF NOT EXISTS idx_faturas_data_vencimento ON faturas(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_faturas_colaboradores_fatura ON faturas_colaboradores(fatura_id);
CREATE INDEX IF NOT EXISTS idx_faturas_colaboradores_colaborador ON faturas_colaboradores(colaborador_id);

-- Desabilitar RLS para as tabelas (seguindo padrão do projeto)
ALTER TABLE faturas DISABLE ROW LEVEL SECURITY;
ALTER TABLE faturas_colaboradores DISABLE ROW LEVEL SECURITY;
