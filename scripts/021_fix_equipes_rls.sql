-- Remover política antiga que não estava funcionando corretamente
DROP POLICY IF EXISTS "Adm e Gerente podem gerenciar equipes" ON equipes;

-- Política: Todos podem ver equipes
DROP POLICY IF EXISTS "Todos podem ver equipes" ON equipes;
CREATE POLICY "Todos podem ver equipes" ON equipes
  FOR SELECT
  USING (true);

-- Política: Apenas Adm e Gerente podem inserir equipes
CREATE POLICY "Adm e Gerente podem criar equipes" ON equipes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM colaboradores
      WHERE colaboradores.user_id = auth.uid()
      AND colaboradores.tipo_acesso IN ('Adm', 'Gerente')
    )
  );

-- Política: Apenas Adm e Gerente podem atualizar equipes
CREATE POLICY "Adm e Gerente podem atualizar equipes" ON equipes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM colaboradores
      WHERE colaboradores.user_id = auth.uid()
      AND colaboradores.tipo_acesso IN ('Adm', 'Gerente')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM colaboradores
      WHERE colaboradores.user_id = auth.uid()
      AND colaboradores.tipo_acesso IN ('Adm', 'Gerente')
    )
  );

-- Política: Apenas Adm e Gerente podem deletar equipes
CREATE POLICY "Adm e Gerente podem deletar equipes" ON equipes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM colaboradores
      WHERE colaboradores.user_id = auth.uid()
      AND colaboradores.tipo_acesso IN ('Adm', 'Gerente')
    )
  );
