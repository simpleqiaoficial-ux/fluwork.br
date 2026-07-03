-- Corrigir tipos numéricos para suportar valores maiores
-- DECIMAL(5,2) só suporta até 999,99
-- Alterando para DECIMAL(10,2) que suporta até 99.999.999,99

ALTER TABLE pedidos_pagamento 
  ALTER COLUMN horas_extras TYPE DECIMAL(10, 2),
  ALTER COLUMN valor_km TYPE DECIMAL(10, 2),
  ALTER COLUMN valor_total TYPE DECIMAL(12, 2);
