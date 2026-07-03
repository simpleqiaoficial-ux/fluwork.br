-- Criar supervisor com email phdsilva0@gmail.com
INSERT INTO colaboradores (
  id,
  nome,
  email,
  tipo_acesso,
  salario,
  created_at
) VALUES (
  gen_random_uuid(),
  'Supervisor',
  'phdsilva0@gmail.com',
  'Supervisor',
  0,
  NOW()
);
