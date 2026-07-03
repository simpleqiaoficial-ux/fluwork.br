-- Remover todas as políticas RLS existentes e criar novas que funcionam com service role

-- Tabela gerentes_equipes
DROP POLICY IF EXISTS "Permitir visualização de gerentes_equipes" ON gerentes_equipes;
DROP POLICY IF EXISTS "Permitir inserção de gerentes_equipes" ON gerentes_equipes;
DROP POLICY IF EXISTS "Permitir exclusão de gerentes_equipes" ON gerentes_equipes;
DROP POLICY IF EXISTS "Permitir atualização de gerentes_equipes" ON gerentes_equipes;

-- Criar políticas que permitem todas as operações (service role bypassa isso de qualquer forma)
CREATE POLICY "Allow all select on gerentes_equipes" ON gerentes_equipes
  FOR SELECT USING (true);

CREATE POLICY "Allow all insert on gerentes_equipes" ON gerentes_equipes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all update on gerentes_equipes" ON gerentes_equipes
  FOR UPDATE USING (true);

CREATE POLICY "Allow all delete on gerentes_equipes" ON gerentes_equipes
  FOR DELETE USING (true);

-- Tabela equipes
DROP POLICY IF EXISTS "Permitir leitura de equipes" ON equipes;
DROP POLICY IF EXISTS "Permitir inserção de equipes" ON equipes;
DROP POLICY IF EXISTS "Permitir exclusão de equipes" ON equipes;
DROP POLICY IF EXISTS "Permitir atualização de equipes" ON equipes;

CREATE POLICY "Allow all select on equipes" ON equipes
  FOR SELECT USING (true);

CREATE POLICY "Allow all insert on equipes" ON equipes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all update on equipes" ON equipes
  FOR UPDATE USING (true);

CREATE POLICY "Allow all delete on equipes" ON equipes
  FOR DELETE USING (true);

-- Tabela colaboradores
DROP POLICY IF EXISTS "Permitir leitura de colaboradores" ON colaboradores;
DROP POLICY IF EXISTS "Permitir inserção de colaboradores" ON colaboradores;
DROP POLICY IF EXISTS "Permitir exclusão de colaboradores" ON colaboradores;
DROP POLICY IF EXISTS "Permitir atualização de colaboradores" ON colaboradores;

CREATE POLICY "Allow all select on colaboradores" ON colaboradores
  FOR SELECT USING (true);

CREATE POLICY "Allow all insert on colaboradores" ON colaboradores
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all update on colaboradores" ON colaboradores
  FOR UPDATE USING (true);

CREATE POLICY "Allow all delete on colaboradores" ON colaboradores
  FOR DELETE USING (true);

-- Tabela pedidos_pagamento
DROP POLICY IF EXISTS "Permitir leitura de pedidos" ON pedidos_pagamento;
DROP POLICY IF EXISTS "Permitir inserção de pedidos" ON pedidos_pagamento;
DROP POLICY IF EXISTS "Permitir exclusão de pedidos" ON pedidos_pagamento;
DROP POLICY IF EXISTS "Permitir atualização de pedidos" ON pedidos_pagamento;

CREATE POLICY "Allow all select on pedidos_pagamento" ON pedidos_pagamento
  FOR SELECT USING (true);

CREATE POLICY "Allow all insert on pedidos_pagamento" ON pedidos_pagamento
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all update on pedidos_pagamento" ON pedidos_pagamento
  FOR UPDATE USING (true);

CREATE POLICY "Allow all delete on pedidos_pagamento" ON pedidos_pagamento
  FOR DELETE USING (true);

-- Tabela notas_fiscais
DROP POLICY IF EXISTS "Permitir leitura de notas fiscais" ON notas_fiscais;
DROP POLICY IF EXISTS "Permitir inserção de notas fiscais" ON notas_fiscais;
DROP POLICY IF EXISTS "Permitir exclusão de notas fiscais" ON notas_fiscais;
DROP POLICY IF EXISTS "Permitir atualização de notas fiscais" ON notas_fiscais;

CREATE POLICY "Allow all select on notas_fiscais" ON notas_fiscais
  FOR SELECT USING (true);

CREATE POLICY "Allow all insert on notas_fiscais" ON notas_fiscais
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all update on notas_fiscais" ON notas_fiscais
  FOR UPDATE USING (true);

CREATE POLICY "Allow all delete on notas_fiscais" ON notas_fiscais
  FOR DELETE USING (true);

-- Tabela historico_reajustes
DROP POLICY IF EXISTS "Permitir leitura de histórico" ON historico_reajustes;
DROP POLICY IF EXISTS "Permitir inserção de histórico" ON historico_reajustes;
DROP POLICY IF EXISTS "Permitir exclusão de histórico" ON historico_reajustes;
DROP POLICY IF EXISTS "Permitir atualização de histórico" ON historico_reajustes;

CREATE POLICY "Allow all select on historico_reajustes" ON historico_reajustes
  FOR SELECT USING (true);

CREATE POLICY "Allow all insert on historico_reajustes" ON historico_reajustes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all update on historico_reajustes" ON historico_reajustes
  FOR UPDATE USING (true);

CREATE POLICY "Allow all delete on historico_reajustes" ON historico_reajustes
  FOR DELETE USING (true);
