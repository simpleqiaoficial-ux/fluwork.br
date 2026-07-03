-- Adicionar novos status para prorrogação
ALTER TABLE pedidos_pagamento
DROP CONSTRAINT IF EXISTS pedidos_pagamento_status_check;

ALTER TABLE pedidos_pagamento
ADD CONSTRAINT pedidos_pagamento_status_check
CHECK (status IN (
  'pendente_gerente',
  'pendente_financeiro',
  'aprovado',
  'recusado',
  'correcao',
  'pago',
  'aguardando_prorrogacao',
  'prorrogacao_negada'
));
