-- Remove o usuário existente se houver
DELETE FROM colaboradores WHERE email = 'techdeze@gmail.com';

-- Insere o usuário admin com todas as informações
INSERT INTO colaboradores (
  nome_completo,
  salario,
  cnpj,
  data_nascimento,
  email,
  senha_hash,
  tipo_acesso,
  created_at
) VALUES (
  'Administrador',
  0.00,
  '00000000000000',
  '1990-01-01',
  'techdeze@gmail.com',
  'Lagunan1201@',
  'Adm',
  NOW()
);
