-- 1. Create optimization prompts table
CREATE TABLE IF NOT EXISTS public.j_ads_optimization_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('meta', 'google')),
  objective TEXT NOT NULL,
  prompt_type TEXT NOT NULL CHECK (prompt_type IN ('transcription', 'analysis')),
  prompt_text TEXT NOT NULL,
  variables JSONB DEFAULT '["account_name", "objectives", "platform", "context"]'::jsonb,
  is_default BOOLEAN DEFAULT true,
  edited_by TEXT,
  previous_version TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_platform_objective_type UNIQUE(platform, objective, prompt_type)
);

-- 2. Update optimization recordings table
ALTER TABLE public.j_ads_optimization_recordings
ADD COLUMN IF NOT EXISTS override_context TEXT,
ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'meta' CHECK (platform IN ('meta', 'google')),
ADD COLUMN IF NOT EXISTS selected_objectives TEXT[];

-- 3. Enable RLS on prompts table
ALTER TABLE public.j_ads_optimization_prompts ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for prompts
CREATE POLICY "Authenticated users can read prompts"
ON public.j_ads_optimization_prompts
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage prompts"
ON public.j_ads_optimization_prompts
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- 5. Trigger for updated_at
CREATE TRIGGER update_j_ads_optimization_prompts_updated_at
BEFORE UPDATE ON public.j_ads_optimization_prompts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Seed initial Meta Ads transcription prompts
INSERT INTO public.j_ads_optimization_prompts (platform, objective, prompt_type, prompt_text) VALUES
('meta', 'Vendas', 'transcription', 'Ao transcrever, foque especialmente em métricas de conversão, ROAS, custo por compra (CPA), valor do pedido, taxa de conversão do checkout. Contexto da conta: {context}'),
('meta', 'Seguidores', 'transcription', 'Ao transcrever, destaque crescimento de audiência, custo por seguidor, alcance, frequência, impressões. Contexto da conta: {context}'),
('meta', 'Engajamento', 'transcription', 'Ao transcrever, enfatize interações (curtidas, comentários, compartilhamentos), taxa de engajamento, salvamentos, cliques no link. Contexto da conta: {context}'),
('meta', 'Conversas', 'transcription', 'Ao transcrever, priorize conversas iniciadas, custo por conversa, taxa de resposta, qualidade das leads. Contexto da conta: {context}'),
('meta', 'Tráfego', 'transcription', 'Ao transcrever, foque em cliques no link, CTR (taxa de cliques), custo por clique (CPC), visualizações de página de destino. Contexto da conta: {context}'),
('meta', 'Reconhecimento', 'transcription', 'Ao transcrever, destaque alcance, impressões, frequência, recall da marca, reconhecimento estimado. Contexto da conta: {context}'),
('meta', 'Cadastros', 'transcription', 'Ao transcrever, priorize registros completos, custo por cadastro, taxa de conclusão do formulário, qualidade dos leads. Contexto da conta: {context}'),
('meta', 'Visualizações de Vídeo', 'transcription', 'Ao transcrever, enfatize ThruPlay (vídeos assistidos até o fim), taxa de retenção, tempo médio de visualização, vídeos de 3 segundos. Contexto da conta: {context}'),
('meta', 'Alcance', 'transcription', 'Ao transcrever, foque em pessoas alcançadas, frequência, CPM (custo por mil impressões), alcance único. Contexto da conta: {context}'),
('meta', 'Leads', 'transcription', 'Ao transcrever, priorize leads gerados, custo por lead (CPL), qualidade dos leads, taxa de conversão de formulário. Contexto da conta: {context}')
ON CONFLICT (platform, objective, prompt_type) DO NOTHING;

-- 7. Seed initial Meta Ads analysis prompts
INSERT INTO public.j_ads_optimization_prompts (platform, objective, prompt_type, prompt_text) VALUES
('meta', 'Vendas', 'analysis', 'Analise focando em estratégias de conversão, otimizações de funil de vendas, ajustes de lances para maximizar ROAS, públicos compradores, criativos de alta conversão.'),
('meta', 'Seguidores', 'analysis', 'Analise focando em estratégias de crescimento de audiência, otimizações de alcance, públicos lookalike de seguidores, criativos virais, frequência ideal.'),
('meta', 'Engajamento', 'analysis', 'Analise focando em estratégias de engajamento, otimizações de criativos interativos, públicos engajados, formatos que geram conversas (enquetes, perguntas).'),
('meta', 'Conversas', 'analysis', 'Analise focando em estratégias de geração de conversas, otimizações de mensagens automáticas, públicos com intenção de compra, criativos que incentivam perguntas.'),
('meta', 'Tráfego', 'analysis', 'Analise focando em estratégias de geração de tráfego qualificado, otimizações de páginas de destino, públicos com intenção de clique, criativos com CTAs fortes.'),
('meta', 'Reconhecimento', 'analysis', 'Analise focando em estratégias de reconhecimento de marca, otimizações de alcance e frequência, públicos amplos, criativos memoráveis e impactantes.'),
('meta', 'Cadastros', 'analysis', 'Analise focando em estratégias de captura de leads, otimizações de formulários, públicos com intenção de cadastro, criativos com ofertas irresistíveis.'),
('meta', 'Visualizações de Vídeo', 'analysis', 'Analise focando em estratégias de retenção de vídeo, otimizações de hook inicial, públicos interessados em vídeos, formatos curtos vs. longos.'),
('meta', 'Alcance', 'analysis', 'Analise focando em estratégias de maximização de alcance, otimizações de CPM, públicos amplos, criativos de alta relevância.'),
('meta', 'Leads', 'analysis', 'Analise focando em estratégias de geração de leads qualificados, otimizações de formulários nativos, públicos com intenção de compra, criativos com benefícios claros.')
ON CONFLICT (platform, objective, prompt_type) DO NOTHING;