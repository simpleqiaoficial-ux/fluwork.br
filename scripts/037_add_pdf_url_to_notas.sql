-- Adicionar campo para armazenar URL do PDF da nota fiscal
ALTER TABLE notas_fiscais 
ADD COLUMN IF NOT EXISTS arquivo_pdf_url TEXT;

-- Renomear coluna existente para deixar claro que é o XML
ALTER TABLE notas_fiscais 
RENAME COLUMN arquivo_url TO arquivo_xml_url;

-- Comentários para documentação
COMMENT ON COLUMN notas_fiscais.arquivo_xml_url IS 'URL do arquivo XML da nota fiscal (dados estruturados)';
COMMENT ON COLUMN notas_fiscais.arquivo_pdf_url IS 'URL do arquivo PDF da nota fiscal (visualização)';
