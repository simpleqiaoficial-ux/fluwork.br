-- Create centros_custo table
CREATE TABLE IF NOT EXISTS centros_custo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS (consistent with rest of system)
ALTER TABLE centros_custo DISABLE ROW LEVEL SECURITY;
