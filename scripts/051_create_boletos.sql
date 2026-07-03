-- Create boletos table
CREATE TABLE IF NOT EXISTS boletos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_boleto TEXT NOT NULL UNIQUE,
  banco TEXT NOT NULL,
  agencia TEXT NOT NULL,
  conta TEXT NOT NULL,
  digito_verificador TEXT,
  centro_custo_id UUID REFERENCES centros_custo(id),
  tipo_boleto TEXT DEFAULT 'cedente', -- cedente ou beneficiario
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  criado_por UUID REFERENCES colaboradores(id)
);

-- Create index for numero_boleto
CREATE INDEX idx_boletos_numero ON boletos(numero_boleto);
CREATE INDEX idx_boletos_banco ON boletos(banco);
CREATE INDEX idx_boletos_centro_custo ON boletos(centro_custo_id);
