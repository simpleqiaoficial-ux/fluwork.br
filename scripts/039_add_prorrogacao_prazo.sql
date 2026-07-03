-- Adicionar campos para controle de prorrogação de prazo
ALTER TABLE pedidos_pagamento
ADD COLUMN IF NOT EXISTS prorrogacao_solicitada BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS motivo_prorrogacao TEXT,
ADD COLUMN IF NOT EXISTS data_solicitacao_prorrogacao TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS prorrogacao_aprovada BOOLEAN,
ADD COLUMN IF NOT EXISTS observacao_prorrogacao TEXT;
