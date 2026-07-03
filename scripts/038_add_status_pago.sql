-- Adicionar novo status "pago" para pedidos finalizados
-- Quando o financeiro aprovar a nota, o pedido vai para "pago" e sai de "Meus Pagamentos"

-- Drop o constraint antigo e adicionar o novo com status "pago"
ALTER TABLE pedidos_pagamento 
DROP CONSTRAINT IF EXISTS pedidos_pagamento_status_check;

ALTER TABLE pedidos_pagamento 
ADD CONSTRAINT pedidos_pagamento_status_check 
CHECK (status IN ('pendente_gerente', 'pendente_financeiro', 'aprovado', 'recusado', 'correcao', 'pago'));
