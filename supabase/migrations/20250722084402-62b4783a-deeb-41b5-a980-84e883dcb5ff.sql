-- Criar tabela error_logs
CREATE TABLE public.error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  error_type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  stack_trace TEXT,
  url VARCHAR(500),
  user_email VARCHAR(255),
  user_agent TEXT,
  component_name VARCHAR(100),
  severity VARCHAR(20) DEFAULT 'error',
  resolved BOOLEAN DEFAULT FALSE,
  metadata JSONB
);

-- Habilitar RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Política para managers verem apenas seus próprios logs
CREATE POLICY "Users can view their own error logs" 
ON public.error_logs 
FOR SELECT 
USING (user_email = auth.jwt() ->> 'email');

-- Política para inserção de logs
CREATE POLICY "Users can insert error logs" 
ON public.error_logs 
FOR INSERT 
WITH CHECK (true);

-- Política para atualização (marcar como resolvido)
CREATE POLICY "Users can update their own error logs" 
ON public.error_logs 
FOR UPDATE 
USING (user_email = auth.jwt() ->> 'email');

-- Criar índices para performance
CREATE INDEX idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX idx_error_logs_user_email ON public.error_logs(user_email);
CREATE INDEX idx_error_logs_error_type ON public.error_logs(error_type);
CREATE INDEX idx_error_logs_resolved ON public.error_logs(resolved);

-- Função para limpeza automática de logs antigos (90 dias)
CREATE OR REPLACE FUNCTION public.cleanup_old_error_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.error_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;