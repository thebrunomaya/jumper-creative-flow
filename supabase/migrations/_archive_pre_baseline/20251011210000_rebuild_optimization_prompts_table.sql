-- Rebuild j_ads_optimization_prompts table aligned with 3-step system
-- Step 1: Transcribe (Whisper) - future use
-- Step 2: Process (Claude organize bullets) - current focus
-- Step 3: Analyze (Claude final analysis) - future use

-- Drop existing table
DROP TABLE IF EXISTS j_ads_optimization_prompts CASCADE;

-- Recreate table with updated structure
CREATE TABLE j_ads_optimization_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('meta', 'google')),
  objective TEXT NOT NULL,
  prompt_type TEXT NOT NULL CHECK (prompt_type IN ('transcribe', 'process', 'analyze')),
  prompt_text TEXT NOT NULL,
  variables TEXT[] DEFAULT ARRAY['account_name', 'objectives', 'platform', 'context'],
  is_default BOOLEAN DEFAULT true,
  edited_by TEXT,
  previous_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (platform, objective, prompt_type)
);

-- Create index for fast lookups
CREATE INDEX idx_optimization_prompts_lookup ON j_ads_optimization_prompts(platform, objective, prompt_type);

-- Add comment
COMMENT ON TABLE j_ads_optimization_prompts IS 'Custom prompts for optimization workflow: transcribe (Whisper context), process (organize bullets), analyze (final analysis)';

-- Enable RLS
ALTER TABLE j_ads_optimization_prompts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone authenticated can read
CREATE POLICY "Anyone authenticated can read prompts"
  ON j_ads_optimization_prompts FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policy: Only admins can modify
CREATE POLICY "Only admins can modify prompts"
  ON j_ads_optimization_prompts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM j_ads_users
      WHERE j_ads_users.id = auth.uid()
      AND j_ads_users.role = 'admin'
    )
  );

-- ============================================
-- INSERT: META ADS - PROCESS PROMPTS
-- ============================================

INSERT INTO j_ads_optimization_prompts (platform, objective, prompt_type, prompt_text) VALUES
('meta', 'Vendas', 'process', '📊 MÉTRICAS PRIORITÁRIAS:
- ROAS (Return on Ad Spend), em decimal (ex: 3.2x)
- CPA (Custo por Aquisição), em R$
- Taxa de conversão, em %
- AOV (Valor Médio do Pedido), em R$
- Custo total, em R$'),

('meta', 'Tráfego', 'process', '📊 MÉTRICAS PRIORITÁRIAS:
- CTR (Click-Through Rate), em %
- CPC (Custo por Clique), em R$
- Cliques no link, número absoluto
- Impressões, número absoluto
- Alcance único, número de pessoas'),

('meta', 'Leads', 'process', '📊 MÉTRICAS PRIORITÁRIAS:
- CPL (Custo por Lead), em R$
- Leads gerados, número absoluto
- Taxa de conversão do formulário, em %
- Qualidade dos leads (MQL/SQL), em %
- Custo total, em R$'),

('meta', 'Engajamento', 'process', '📊 MÉTRICAS PRIORITÁRIAS:
- Taxa de engajamento, em %
- Interações totais (curtidas, comentários, compartilhamentos), número absoluto
- Salvamentos, número absoluto
- Cliques no link, número absoluto
- Alcance, número de pessoas'),

('meta', 'Reconhecimento', 'process', '📊 MÉTRICAS PRIORITÁRIAS:
- Alcance, número de pessoas
- Impressões, número absoluto
- Frequência, decimal (ex: 2.3)
- CPM (Custo por Mil Impressões), em R$
- Recall da marca, em %'),

('meta', 'Alcance', 'process', '📊 MÉTRICAS PRIORITÁRIAS:
- Pessoas alcançadas, número absoluto
- Impressões, número absoluto
- Frequência, decimal (ex: 1.8)
- CPM (Custo por Mil Impressões), em R$
- Alcance único, número de pessoas'),

('meta', 'Visualizações de Vídeo', 'process', '📊 MÉTRICAS PRIORITÁRIAS:
- ThruPlay (vídeos assistidos até o fim), número absoluto
- Taxa de retenção, em %
- Tempo médio de visualização, em segundos
- Visualizações de 3 segundos, número absoluto
- CPV (Custo por Visualização), em R$'),

('meta', 'Conversas', 'process', '📊 MÉTRICAS PRIORITÁRIAS:
- Conversas iniciadas, número absoluto
- Custo por conversa, em R$
- Taxa de resposta, em %
- Qualidade das conversas (intenção de compra), em %
- Custo total, em R$'),

('meta', 'Cadastros', 'process', '📊 MÉTRICAS PRIORITÁRIAS:
- Cadastros completos, número absoluto
- Custo por cadastro, em R$
- Taxa de conclusão do formulário, em %
- Qualidade dos cadastros, em %
- Custo total, em R$'),

('meta', 'Seguidores', 'process', '📊 MÉTRICAS PRIORITÁRIAS:
- Novos seguidores, número absoluto
- Custo por seguidor, em R$
- Alcance, número de pessoas
- Taxa de engajamento, em %
- Impressões, número absoluto');

-- ============================================
-- INSERT: GOOGLE ADS - PROCESS PROMPTS
-- ============================================

INSERT INTO j_ads_optimization_prompts (platform, objective, prompt_type, prompt_text) VALUES
('google', 'Vendas', 'process', '📊 MÉTRICAS PRIORITÁRIAS:
- ROAS (Return on Ad Spend), em decimal (ex: 4.1x)
- CPA (Custo por Aquisição), em R$
- Taxa de conversão, em %
- Valor de conversão médio, em R$
- Custo total, em R$'),

('google', 'Tráfego', 'process', '📊 MÉTRICAS PRIORITÁRIAS:
- CTR (Click-Through Rate), em %
- CPC (Custo por Clique), em R$
- Cliques, número absoluto
- Impressões, número absoluto
- Posição média do anúncio, decimal'),

('google', 'Leads', 'process', '📊 MÉTRICAS PRIORITÁRIAS:
- CPL (Custo por Lead), em R$
- Conversões (leads), número absoluto
- Taxa de conversão, em %
- Qualidade dos leads, em %
- Custo total, em R$'),

('google', 'Engajamento', 'process', '📊 MÉTRICAS PRIORITÁRIAS:
- Taxa de engajamento, em %
- Interações totais, número absoluto
- Visualizações de vídeo (YouTube), número absoluto
- CTR, em %
- Tempo médio de engajamento, em segundos'),

('google', 'Reconhecimento', 'process', '📊 MÉTRICAS PRIORITÁRIAS:
- Impressões, número absoluto
- Alcance, número de pessoas
- Frequência, decimal (ex: 2.1)
- CPM (Custo por Mil Impressões), em R$
- Share of Voice, em %'),

('google', 'Alcance', 'process', '📊 MÉTRICAS PRIORITÁRIAS:
- Alcance único, número de pessoas
- Impressões, número absoluto
- Frequência, decimal (ex: 1.9)
- CPM (Custo por Mil Impressões), em R$
- Cobertura geográfica, em %'),

('google', 'Visualizações de Vídeo', 'process', '📊 MÉTRICAS PRIORITÁRIAS:
- Visualizações de vídeo, número absoluto
- Taxa de visualização, em %
- CPV (Custo por Visualização), em R$
- Tempo médio de visualização, em segundos
- Inscritos ganhos, número absoluto'),

('google', 'Conversas', 'process', '📊 MÉTRICAS PRIORITÁRIAS:
- Conversões de mensagem, número absoluto
- Custo por conversa, em R$
- Taxa de resposta, em %
- Chamadas telefônicas, número absoluto
- Custo total, em R$'),

('google', 'Cadastros', 'process', '📊 MÉTRICAS PRIORITÁRIAS:
- Cadastros, número absoluto
- Custo por cadastro, em R$
- Taxa de conclusão do formulário, em %
- Qualidade dos cadastros, em %
- Custo total, em R$'),

('google', 'Seguidores', 'process', '📊 MÉTRICAS PRIORITÁRIAS:
- Inscritos ganhos (YouTube), número absoluto
- Custo por inscrito, em R$
- Taxa de crescimento, em %
- Visualizações de canal, número absoluto
- Engajamento médio, em %');

-- ============================================
-- FUTURE: Transcribe and Analyze prompts
-- ============================================
-- TODO: Add 'transcribe' prompts for Step 1 (Whisper context)
-- TODO: Add 'analyze' prompts for Step 3 (Final AI analysis)
