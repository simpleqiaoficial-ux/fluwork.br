-- Corrigir o tipo de dados dos campos numéricos para suportar valores maiores
ALTER TABLE pedidos_pagamento 
  ALTER COLUMN horas_extras TYPE NUMERIC(12,2),
  ALTER COLUMN valor_km TYPE NUMERIC(12,2),
  ALTER COLUMN valor_total TYPE NUMERIC(14,2);

-- Garantir que as colunas do fluxo de aprovação existam
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='pedidos_pagamento' AND column_name='criado_por_colaborador_id') THEN
    ALTER TABLE pedidos_pagamento ADD COLUMN criado_por_colaborador_id UUID REFERENCES colaboradores(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='pedidos_pagamento' AND column_name='aprovado_gerente') THEN
    ALTER TABLE pedidos_pagamento ADD COLUMN aprovado_gerente BOOLEAN;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='pedidos_pagamento' AND column_name='aprovado_financeiro') THEN
    ALTER TABLE pedidos_pagamento ADD COLUMN aprovado_financeiro BOOLEAN;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='pedidos_pagamento' AND column_name='observacao_gerente') THEN
    ALTER TABLE pedidos_pagamento ADD COLUMN observacao_gerente TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='pedidos_pagamento' AND column_name='observacao_financeiro') THEN
    ALTER TABLE pedidos_pagamento ADD COLUMN observacao_financeiro TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='pedidos_pagamento' AND column_name='data_aprovacao_gerente') THEN
    ALTER TABLE pedidos_pagamento ADD COLUMN data_aprovacao_gerente TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='pedidos_pagamento' AND column_name='data_aprovacao_financeiro') THEN
    ALTER TABLE pedidos_pagamento ADD COLUMN data_aprovacao_financeiro TIMESTAMPTZ;
  END IF;
END $$;
