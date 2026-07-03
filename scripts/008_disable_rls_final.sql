-- Desabilitar RLS completamente para permitir operações administrativas
-- Em produção, você deve implementar políticas RLS baseadas em roles

ALTER TABLE colaboradores DISABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_pagamento DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Permitir leitura de colaboradores autenticados" ON colaboradores;
DROP POLICY IF EXISTS "Permitir inserção de colaboradores autenticados" ON colaboradores;
DROP POLICY IF EXISTS "Permitir atualização de colaboradores autenticados" ON colaboradores;
DROP POLICY IF EXISTS "Permitir exclusão de colaboradores autenticados" ON colaboradores;

DROP POLICY IF EXISTS "Permitir leitura de pedidos autenticados" ON pedidos_pagamento;
DROP POLICY IF EXISTS "Permitir inserção de pedidos autenticados" ON pedidos_pagamento;
DROP POLICY IF EXISTS "Permitir atualização de pedidos autenticados" ON pedidos_pagamento;
DROP POLICY IF EXISTS "Permitir exclusão de pedidos autenticados" ON pedidos_pagamento;

-- Comentário: Para produção, implemente políticas baseadas no campo tipo_acesso
-- Exemplo:
-- CREATE POLICY "Admins podem fazer tudo" ON colaboradores
-- FOR ALL USING (
--   EXISTS (
--     SELECT 1 FROM colaboradores 
--     WHERE user_id = auth.uid() 
--     AND tipo_acesso = 'Adm'
--   )
-- );
