-- Adiciona coluna para armazenar histórico de reajustes como JSON
-- Isso evita a necessidade de criar uma tabela separada

ALTER TABLE colaboradores 
ADD COLUMN IF NOT EXISTS historico_reajustes JSONB DEFAULT '[]'::jsonb;

-- Adiciona comentário explicativo
COMMENT ON COLUMN colaboradores.historico_reajustes IS 'Histórico de reajustes salariais em formato JSON';
