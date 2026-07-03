-- Criar tabela de notas fiscais com validações
CREATE TABLE IF NOT EXISTS notas_fiscais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID REFERENCES pedidos_pagamento(id) ON DELETE CASCADE,
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
  
  -- Dados da nota fiscal
  numero_nfse TEXT NOT NULL,
  chave_acesso TEXT,
  competencia_mes INTEGER NOT NULL CHECK (competencia_mes >= 1 AND competencia_mes <= 12),
  competencia_ano INTEGER NOT NULL CHECK (competencia_ano >= 2020),
  valor_servico DECIMAL(10,2) NOT NULL CHECK (valor_servico > 0),
  cpf_cnpj_prestador TEXT NOT NULL,
  arquivo_url TEXT NOT NULL,
  
  -- Status das validações
  validacao_identidade BOOLEAN DEFAULT false,
  validacao_competencia BOOLEAN DEFAULT false,
  validacao_valor BOOLEAN DEFAULT false,
  validacao_duplicidade BOOLEAN DEFAULT false,
  
  -- Mensagens de erro/alerta
  mensagem_validacao TEXT,
  
  -- Status geral
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  aprovado_por UUID REFERENCES colaboradores(id),
  data_aprovacao TIMESTAMP,
  observacao_financeiro TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Garantir que não haja notas duplicadas para o mesmo pedido
  UNIQUE(pedido_id),
  
  -- Garantir que número de NFS-e seja único por colaborador
  UNIQUE(colaborador_id, numero_nfse)
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_pedido ON notas_fiscais(pedido_id);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_colaborador ON notas_fiscais(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_numero ON notas_fiscais(numero_nfse);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_chave ON notas_fiscais(chave_acesso);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_status ON notas_fiscais(status);

-- Desabilitar RLS para simplificar
ALTER TABLE notas_fiscais DISABLE ROW LEVEL SECURITY;

-- Adicionar campo na tabela de pedidos para indicar se tem nota anexada
ALTER TABLE pedidos_pagamento 
ADD COLUMN IF NOT EXISTS nota_fiscal_anexada BOOLEAN DEFAULT false;

-- Comentários para documentação
COMMENT ON TABLE notas_fiscais IS 'Armazena notas fiscais anexadas pelos colaboradores com validações automáticas';
COMMENT ON COLUMN notas_fiscais.validacao_identidade IS 'Valida se CPF/CNPJ e nome da nota correspondem ao colaborador';
COMMENT ON COLUMN notas_fiscais.validacao_competencia IS 'Valida se mês/ano da nota correspondem ao mês/ano do pedido';
COMMENT ON COLUMN notas_fiscais.validacao_valor IS 'Valida se valor da nota é exatamente igual ao valor do pedido';
COMMENT ON COLUMN notas_fiscais.validacao_duplicidade IS 'Valida se a nota não foi usada anteriormente';
