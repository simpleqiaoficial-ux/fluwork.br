-- Adicionar campo de data de aniversário de contrato nos colaboradores
ALTER TABLE colaboradores 
ADD COLUMN IF NOT EXISTS data_aniversario_contrato DATE;

-- Comentário explicativo
COMMENT ON COLUMN colaboradores.data_aniversario_contrato IS 'Data de aniversário do contrato para controle de reajustes anuais';
