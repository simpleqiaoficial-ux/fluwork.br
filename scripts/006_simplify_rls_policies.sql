-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Permitir inserção de colaboradores autenticados" ON colaboradores;
DROP POLICY IF EXISTS "Usuários autenticados podem ler colaboradores" ON colaboradores;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar colaboradores" ON colaboradores;
DROP POLICY IF EXISTS "Usuários autenticados podem criar pedidos" ON pedidos_pagamento;
DROP POLICY IF EXISTS "Usuários autenticados podem ler pedidos" ON pedidos_pagamento;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar pedidos" ON pedidos_pagamento;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar pedidos" ON pedidos_pagamento;

-- Desabilitar RLS temporariamente para permitir operações administrativas
-- Em produção, você deve criar políticas mais específicas baseadas em roles
ALTER TABLE colaboradores DISABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_pagamento DISABLE ROW LEVEL SECURITY;

-- Nota: Para um sistema em produção, você deve:
-- 1. Criar uma tabela de roles/permissões
-- 2. Implementar políticas RLS baseadas no tipo_acesso do colaborador
-- 3. Garantir que apenas usuários com tipo_acesso 'Adm' ou 'Financeiro' possam criar/editar
