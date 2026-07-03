-- Desabilitar RLS temporariamente para reconfigurar
ALTER TABLE colaboradores DISABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_pagamento DISABLE ROW LEVEL SECURITY;
ALTER TABLE equipes DISABLE ROW LEVEL SECURITY;
ALTER TABLE gerentes_equipes DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas antigas
DROP POLICY IF EXISTS "Colaboradores podem ver seus próprios dados" ON colaboradores;
DROP POLICY IF EXISTS "Colaboradores podem ver seus próprios pedidos" ON pedidos_pagamento;
DROP POLICY IF EXISTS "Service role tem acesso total aos colaboradores" ON colaboradores;
DROP POLICY IF EXISTS "Service role tem acesso total aos pedidos" ON pedidos_pagamento;
DROP POLICY IF EXISTS "Permitir leitura de colaboradores autenticados" ON colaboradores;
DROP POLICY IF EXISTS "Permitir inserção de colaboradores autenticados" ON colaboradores;
DROP POLICY IF EXISTS "Permitir atualização de colaboradores autenticados" ON colaboradores;
DROP POLICY IF EXISTS "Permitir exclusão de colaboradores autenticados" ON colaboradores;
DROP POLICY IF EXISTS "Permitir leitura de pedidos autenticados" ON pedidos_pagamento;
DROP POLICY IF EXISTS "Permitir inserção de pedidos autenticados" ON pedidos_pagamento;
DROP POLICY IF EXISTS "Permitir atualização de pedidos autenticados" ON pedidos_pagamento;
DROP POLICY IF EXISTS "Permitir exclusão de pedidos autenticados" ON pedidos_pagamento;
DROP POLICY IF EXISTS "Usuários autenticados podem ler colaboradores" ON colaboradores;
DROP POLICY IF EXISTS "Usuários autenticados podem criar pedidos" ON pedidos_pagamento;
DROP POLICY IF EXISTS "Usuários autenticados podem ler pedidos" ON pedidos_pagamento;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar pedidos" ON pedidos_pagamento;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar pedidos" ON pedidos_pagamento;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar colaboradores" ON colaboradores;
DROP POLICY IF EXISTS "Todos podem ver equipes" ON equipes;
DROP POLICY IF EXISTS "Adm e Gerente podem gerenciar equipes" ON equipes;
DROP POLICY IF EXISTS "Adm e Gerente podem criar equipes" ON equipes;
DROP POLICY IF EXISTS "Adm e Gerente podem atualizar equipes" ON equipes;
DROP POLICY IF EXISTS "Adm e Gerente podem deletar equipes" ON equipes;
DROP POLICY IF EXISTS "Todos podem ver gerentes_equipes" ON gerentes_equipes;
DROP POLICY IF EXISTS "Apenas Adm pode gerenciar gerentes_equipes" ON gerentes_equipes;
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar equipes" ON equipes;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir equipes" ON equipes;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar equipes" ON equipes;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar equipes" ON equipes;
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar gerentes_equipes" ON gerentes_equipes;
DROP POLICY IF EXISTS "Financeiro e gerente podem inserir gerentes_equipes" ON gerentes_equipes;
DROP POLICY IF EXISTS "Financeiro e gerente podem atualizar gerentes_equipes" ON gerentes_equipes;
DROP POLICY IF EXISTS "Financeiro e gerente podem deletar gerentes_equipes" ON gerentes_equipes;

-- IMPORTANTE: Manter RLS DESABILITADO para permitir autenticação sem token
-- O sistema FluxoPay usa autenticação customizada com sessões server-side
-- não usa Supabase Auth, então não há auth.uid() disponível

-- Para segurança adicional em produção, você pode:
-- 1. Adicionar políticas baseadas em roles de serviço
-- 2. Usar middleware no Next.js para validar permissões
-- 3. Validar todas as queries server-side antes de executar
