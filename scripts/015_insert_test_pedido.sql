-- Script para inserir um pedido de teste para verificar o fluxo de aprovações
-- Este pedido será criado com status "pendente_gerente" para que o gerente possa aprovar

-- Primeiro, vamos buscar os IDs necessários
DO $$
DECLARE
  v_supervisor_id UUID;
  v_colaborador_id UUID;
  v_salario NUMERIC;
BEGIN
  -- Buscar o ID do supervisor
  SELECT id INTO v_supervisor_id
  FROM colaboradores
  WHERE tipo_acesso = 'Supervisor'
  LIMIT 1;

  -- Buscar o ID de um colaborador
  SELECT id, salario INTO v_colaborador_id, v_salario
  FROM colaboradores
  WHERE tipo_acesso = 'Colaborador'
  LIMIT 1;

  -- Se encontrou ambos, inserir o pedido de teste
  IF v_supervisor_id IS NOT NULL AND v_colaborador_id IS NOT NULL THEN
    INSERT INTO pedidos_pagamento (
      colaborador_id,
      criado_por_colaborador_id,
      horas_extras,
      valor_km,
      valor_total,
      status,
      aprovado_gerente,
      aprovado_financeiro
    ) VALUES (
      v_colaborador_id,
      v_supervisor_id,
      500.00,  -- R$ 500 em horas extras
      200.00,  -- R$ 200 em km
      v_salario + 500.00 + 200.00,  -- Total = salário + extras + km
      'pendente_gerente',  -- Status inicial
      NULL,  -- Ainda não aprovado pelo gerente
      NULL   -- Ainda não aprovado pelo financeiro
    );

    RAISE NOTICE 'Pedido de teste criado com sucesso!';
  ELSE
    RAISE NOTICE 'Não foi possível criar pedido de teste. Certifique-se de ter um Supervisor e um Colaborador cadastrados.';
  END IF;
END $$;
