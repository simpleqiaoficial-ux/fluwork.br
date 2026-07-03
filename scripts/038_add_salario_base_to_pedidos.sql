-- Add salario_base column to store the salary at the time the pedido was created
-- This prevents pedido values from changing when the collaborator gets a salary adjustment

ALTER TABLE pedidos_pagamento
ADD COLUMN IF NOT EXISTS salario_base NUMERIC(10, 2);

-- Update existing pedidos with the current salary from colaboradores
UPDATE pedidos_pagamento p
SET salario_base = c.salario
FROM colaboradores c
WHERE p.colaborador_id = c.id
AND p.salario_base IS NULL;
