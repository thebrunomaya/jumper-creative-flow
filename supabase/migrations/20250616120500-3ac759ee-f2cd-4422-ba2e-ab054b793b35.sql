
-- Criar tabela para armazenar o contador global de criativos
CREATE TABLE IF NOT EXISTS public.creative_counter (
  id INTEGER PRIMARY KEY DEFAULT 1,
  counter INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir o registro inicial se não existir
INSERT INTO public.creative_counter (id, counter) 
VALUES (1, 0) 
ON CONFLICT (id) DO NOTHING;

-- Função para incrementar e retornar o próximo contador
CREATE OR REPLACE FUNCTION public.get_next_creative_counter()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  next_counter INTEGER;
BEGIN
  UPDATE public.creative_counter 
  SET counter = counter + 1, updated_at = NOW()
  WHERE id = 1
  RETURNING counter INTO next_counter;
  
  RETURN next_counter;
END;
$$;
