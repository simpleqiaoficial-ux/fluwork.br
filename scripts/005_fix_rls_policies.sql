-- Remover políticas antigas que podem estar causando conflito
DROP POLICY IF EXISTS "Service role tem acesso total aos colaboradores" ON colaboradores;
DROP POLICY IF EXISTS "Service role tem acesso total aos pedidos" ON pedidos_pagamento;

-- Criar política para permitir inserção de novos colaboradores (necessário para signUp)
CREATE POLICY "Permitir inserção de colaboradores autenticados"
ON colaboradores
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política para permitir que usuários autenticados leiam todos os colaboradores
-- (necessário para o sistema administrativo funcionar)
CREATE POLICY "Usuários autenticados podem ler colaboradores"
ON colaboradores
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Política para permitir que usuários autenticados criem pedidos
CREATE POLICY "Usuários autenticados podem criar pedidos"
ON pedidos_pagamento
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Política para permitir que usuários autenticados leiam todos os pedidos
CREATE POLICY "Usuários autenticados podem ler pedidos"
ON pedidos_pagamento
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Política para permitir que usuários autenticados atualizem pedidos
CREATE POLICY "Usuários autenticados podem atualizar pedidos"
ON pedidos_pagamento
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Política para permitir que usuários autenticados deletem pedidos
CREATE POLICY "Usuários autenticados podem deletar pedidos"
ON pedidos_pagamento
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Política para permitir que usuários autenticados deletem colaboradores
CREATE POLICY "Usuários autenticados podem deletar colaboradores"
ON colaboradores
FOR DELETE
USING (auth.uid() IS NOT NULL);
