-- Inserir um pedido de teste para testar o fluxo de aprovações
-- Este pedido será criado pelo Supervisor para o Colaborador Pedro

INSERT INTO pedidos_pagamento (
  id,
  colaborador_id,
  criado_por_colaborador_id,
  horas_extras,
  valor_km,
  valor_total,
  status,
  aprovado_gerente,
  aprovado_financeiro,
  created_at
)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM colaboradores WHERE nome_completo = 'Pedro' LIMIT 1),
  (SELECT id FROM colaboradores WHERE tipo_acesso = 'Supervisor' LIMIT 1),
  50.00,
  100.00,
  (SELECT salario FROM colaboradores WHERE nome_completo = 'Pedro' LIMIT 1) + 50.00 + 100.00,
  'pendente_gerente',
  false,
  false,
  NOW()
WHERE EXISTS (SELECT 1 FROM colaboradores WHERE nome_completo = 'Pedro')
  AND EXISTS (SELECT 1 FROM colaboradores WHERE tipo_acesso = 'Supervisor');
