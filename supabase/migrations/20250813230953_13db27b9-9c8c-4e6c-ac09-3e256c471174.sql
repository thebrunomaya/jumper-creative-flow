-- Enable Row Level Security on the n8n_historico_mensagens table
ALTER TABLE public.n8n_historico_mensagens ENABLE ROW LEVEL SECURITY;

-- Create restrictive policies to block all user access to WhatsApp message history
-- Following the same security pattern as n8n_fila_mensagens table

CREATE POLICY "No select on n8n_historico_mensagens" 
ON public.n8n_historico_mensagens 
FOR SELECT 
USING (false);

CREATE POLICY "No insert on n8n_historico_mensagens" 
ON public.n8n_historico_mensagens 
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "No update on n8n_historico_mensagens" 
ON public.n8n_historico_mensagens 
FOR UPDATE 
USING (false);

CREATE POLICY "No delete on n8n_historico_mensagens" 
ON public.n8n_historico_mensagens 
FOR DELETE 
USING (false);