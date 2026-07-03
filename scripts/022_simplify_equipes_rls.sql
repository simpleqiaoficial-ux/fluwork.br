-- Remove políticas antigas que podem estar causando conflito
DROP POLICY IF EXISTS "Adm e Gerente podem gerenciar equipes" ON equipes;
DROP POLICY IF EXISTS "Adm e Gerente podem inserir equipes" ON equipes;
DROP POLICY IF EXISTS "Adm e Gerente podem atualizar equipes" ON equipes;
DROP POLICY IF EXISTS "Adm e Gerente podem deletar equipes" ON equipes;
DROP POLICY IF EXISTS "Todos podem visualizar equipes" ON equipes;

-- Cria políticas simples que permitem operações para usuários autenticados
-- A verificação de permissões será feita no código da Server Action

-- Permite SELECT para todos os usuários autenticados
CREATE POLICY "Usuários autenticados podem visualizar equipes" ON equipes
  FOR SELECT
  TO authenticated
  USING (true);

-- Permite INSERT para usuários autenticados
CREATE POLICY "Usuários autenticados podem inserir equipes" ON equipes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Permite UPDATE para usuários autenticados
CREATE POLICY "Usuários autenticados podem atualizar equipes" ON equipes
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Permite DELETE para usuários autenticados
CREATE POLICY "Usuários autenticados podem deletar equipes" ON equipes
  FOR DELETE
  TO authenticated
  USING (true);
