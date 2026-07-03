-- Adiciona políticas de RLS para a tabela gerentes_equipes

-- Desabilitar RLS na tabela gerentes_equipes
ALTER TABLE gerentes_equipes DISABLE ROW LEVEL SECURITY;

-- Política de SELECT: Qualquer usuário autenticado pode ver os relacionamentos
CREATE POLICY "Usuários autenticados podem visualizar gerentes_equipes"
ON gerentes_equipes
FOR SELECT
TO authenticated
USING (true);

-- Política de INSERT: Apenas financeiro e gerente podem inserir
CREATE POLICY "Financeiro e gerente podem inserir gerentes_equipes"
ON gerentes_equipes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM colaboradores
    WHERE colaboradores.user_id = auth.uid()
    AND colaboradores.tipo_acesso IN ('financeiro', 'gerente')
  )
);

-- Política de UPDATE: Apenas financeiro e gerente podem atualizar
CREATE POLICY "Financeiro e gerente podem atualizar gerentes_equipes"
ON gerentes_equipes
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM colaboradores
    WHERE colaboradores.user_id = auth.uid()
    AND colaboradores.tipo_acesso IN ('financeiro', 'gerente')
  )
);

-- Política de DELETE: Apenas financeiro e gerente podem deletar
CREATE POLICY "Financeiro e gerente podem deletar gerentes_equipes"
ON gerentes_equipes
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM colaboradores
    WHERE colaboradores.user_id = auth.uid()
    AND colaboradores.tipo_acesso IN ('financeiro', 'gerente')
  )
);
