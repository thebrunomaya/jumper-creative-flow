-- Add 'transcribe' prompts for Step 1 (Whisper context)
-- These prompts help Whisper API correctly transcribe metric names and technical terms

-- ============================================
-- INSERT: META ADS - TRANSCRIBE PROMPTS
-- ============================================

INSERT INTO j_ads_optimization_prompts (platform, objective, prompt_type, prompt_text) VALUES
('meta', 'Vendas', 'transcribe', 'KEY METRICS: ROAS (Return on Ad Spend), CPA (Cost per Acquisition / Custo por Aquisição), Compras, Purchases, Checkout Iniciado, Initiated Checkout, Add to Cart, Receita, Revenue, Taxa de Conversão, Conversion Rate, AOV (Average Order Value).

COMMON TERMS: Funil de vendas, Sales funnel, Remarketing, Retargeting, Pixel de conversão, Carrinho abandonado, Abandoned cart.'),

('meta', 'Tráfego', 'transcribe', 'KEY METRICS: CTR (Click-Through Rate / Taxa de Cliques), CPC (Cost per Click / Custo por Clique), Cliques no link, Link clicks, Impressões, Impressions, Alcance, Reach, Visualizações de página, Page views.

COMMON TERMS: Landing page, Página de destino, Call-to-action, CTA, Bounce rate, Taxa de rejeição.'),

('meta', 'Leads', 'transcribe', 'KEY METRICS: CPL (Cost per Lead / Custo por Lead), Leads gerados, Leads generated, Taxa de conversão de formulário, Form conversion rate, MQL (Marketing Qualified Lead), SQL (Sales Qualified Lead).

COMMON TERMS: Formulário nativo, Native form, Lead magnet, Isca digital, Qualidade de leads, Lead quality, Follow-up.'),

('meta', 'Engajamento', 'transcribe', 'KEY METRICS: Taxa de engajamento, Engagement rate, Curtidas, Likes, Comentários, Comments, Compartilhamentos, Shares, Salvamentos, Saves, Cliques no link, Link clicks.

COMMON TERMS: Post engagement, Interações, Interactions, Alcance orgânico, Organic reach, Viral, Engajamento pago, Paid engagement.'),

('meta', 'Reconhecimento', 'transcribe', 'KEY METRICS: Alcance, Reach, Impressões, Impressions, Frequência, Frequency, CPM (Cost per Mille / Custo por Mil Impressões), Recall da marca, Brand recall, Share of Voice.

COMMON TERMS: Brand awareness, Reconhecimento de marca, Top of mind, Awareness campaign, Campanha de reconhecimento, Branding.'),

('meta', 'Alcance', 'transcribe', 'KEY METRICS: Pessoas alcançadas, People reached, Impressões, Impressions, Frequência, Frequency, CPM (Cost per Mille), Alcance único, Unique reach, Cobertura, Coverage.

COMMON TERMS: Alcance orgânico, Organic reach, Alcance pago, Paid reach, Saturação de público, Audience saturation, Expansão de alcance, Reach expansion.'),

('meta', 'Visualizações de Vídeo', 'transcribe', 'KEY METRICS: ThruPlay, Reproduções completas, Complete views, Taxa de retenção, Retention rate, Tempo médio de visualização, Average watch time, Visualizações de 3 segundos, 3-second views, CPV (Cost per View).

COMMON TERMS: Video views, Reproduções de vídeo, Hook, Gancho inicial, Reels, Stories, Feed video, Auto-play.'),

('meta', 'Conversas', 'transcribe', 'KEY METRICS: Conversas iniciadas, Conversations started, Custo por conversa, Cost per conversation, Taxa de resposta, Response rate, Mensagens, Messages, WhatsApp conversations.

COMMON TERMS: Click-to-Messenger, Click-to-WhatsApp, Automação de mensagens, Message automation, Chatbot, Resposta automática, Auto-reply, Intenção de compra.'),

('meta', 'Cadastros', 'transcribe', 'KEY METRICS: Cadastros completos, Completed sign-ups, Custo por cadastro, Cost per sign-up, Taxa de conclusão do formulário, Form completion rate, Registros, Registrations.

COMMON TERMS: Sign-up form, Formulário de cadastro, Lead form, Campos do formulário, Form fields, Taxa de abandono, Abandonment rate.'),

('meta', 'Seguidores', 'transcribe', 'KEY METRICS: Novos seguidores, New followers, Custo por seguidor, Cost per follower, Crescimento de audiência, Audience growth, Taxa de engajamento, Engagement rate, Alcance de seguidores, Follower reach.

COMMON TERMS: Page followers, Seguidores da página, Lookalike de seguidores, Follower lookalike, Crescimento orgânico, Organic growth, Social proof.');

-- ============================================
-- INSERT: GOOGLE ADS - TRANSCRIBE PROMPTS
-- ============================================

INSERT INTO j_ads_optimization_prompts (platform, objective, prompt_type, prompt_text) VALUES
('google', 'Vendas', 'transcribe', 'KEY METRICS: ROAS (Return on Ad Spend), CPA (Cost per Acquisition), Conversões, Conversions, Valor de conversão, Conversion value, Taxa de conversão, Conversion rate, Receita, Revenue.

COMMON TERMS: Shopping campaigns, Performance Max, pMax, Smart bidding, Lances inteligentes, Remarketing, Google Analytics, E-commerce tracking.'),

('google', 'Tráfego', 'transcribe', 'KEY METRICS: CTR (Click-Through Rate), CPC (Cost per Click), Cliques, Clicks, Impressões, Impressions, Posição média do anúncio, Average ad position, Índice de qualidade, Quality Score.

COMMON TERMS: Search ads, Anúncios de pesquisa, Display Network, Rede de Display, Keywords, Palavras-chave, Correspondência de palavra-chave, Keyword match type, Landing page experience.'),

('google', 'Leads', 'transcribe', 'KEY METRICS: CPL (Cost per Lead), Conversões de lead, Lead conversions, Taxa de conversão, Conversion rate, Qualidade de leads, Lead quality, Formulários preenchidos, Forms filled.

COMMON TERMS: Lead form extensions, Extensões de formulário, Search campaigns, Call extensions, Extensões de chamada, Lead gen campaigns.'),

('google', 'Engajamento', 'transcribe', 'KEY METRICS: Taxa de engajamento, Engagement rate, Interações, Interactions, Visualizações de vídeo, Video views, CTR de engajamento, Engagement CTR, Tempo médio de engajamento, Average engagement time.

COMMON TERMS: YouTube ads, Display ads, Video campaigns, Bumper ads, Discovery campaigns, TrueView, Skippable ads.'),

('google', 'Reconhecimento', 'transcribe', 'KEY METRICS: Impressões, Impressions, Alcance, Reach, Frequência, Frequency, CPM (Cost per Mille), Share of Voice, Brand lift, Aumento de reconhecimento.

COMMON TERMS: Brand awareness campaigns, Display campaigns, YouTube brand campaigns, Remarketing de marca, Brand remarketing, Audience targeting.'),

('google', 'Alcance', 'transcribe', 'KEY METRICS: Alcance único, Unique reach, Impressões, Impressions, Frequência, Frequency, CPM (Cost per Mille), Cobertura geográfica, Geographic coverage, Pessoas alcançadas, People reached.

COMMON TERMS: Display Network, Rede de Display, YouTube reach campaigns, Maximize reach, Maximizar alcance, Audience expansion, Expansão de público.'),

('google', 'Visualizações de Vídeo', 'transcribe', 'KEY METRICS: Visualizações de vídeo, Video views, Taxa de visualização, View rate, CPV (Cost per View), Tempo médio de visualização, Average watch time, Inscritos ganhos, Subscribers gained, Quartis de visualização, View quartiles.

COMMON TERMS: YouTube ads, TrueView, In-stream ads, Bumper ads, Discovery ads, Video action campaigns, Skippable, Non-skippable, Hook inicial.'),

('google', 'Conversas', 'transcribe', 'KEY METRICS: Conversões de mensagem, Message conversions, Custo por conversa, Cost per conversation, Chamadas telefônicas, Phone calls, Taxa de resposta, Response rate, Call conversions.

COMMON TERMS: Call extensions, Extensões de chamada, Message extensions, Call-only ads, Anúncios somente chamada, Call tracking, Rastreamento de chamadas, Business messages.'),

('google', 'Cadastros', 'transcribe', 'KEY METRICS: Cadastros, Sign-ups, Custo por cadastro, Cost per sign-up, Taxa de conclusão do formulário, Form completion rate, Conversões de cadastro, Sign-up conversions, Registros, Registrations.

COMMON TERMS: Lead form extensions, Landing page optimization, Otimização de landing page, Form fields, Campos de formulário, Conversion tracking, Google Tag Manager.'),

('google', 'Seguidores', 'transcribe', 'KEY METRICS: Inscritos ganhos, Subscribers gained, Custo por inscrito, Cost per subscriber, Taxa de crescimento, Growth rate, Visualizações de canal, Channel views, Engajamento médio, Average engagement.

COMMON TERMS: YouTube channel growth, Crescimento do canal, Subscriber campaigns, Video action campaigns, Channel promotion, Promoção de canal, Community engagement.');

-- Add comment explaining transcribe prompts
COMMENT ON COLUMN j_ads_optimization_prompts.prompt_type IS
'Prompt types: transcribe (Whisper context for Step 1), process (Claude bullet organization for Step 2), analyze (Claude final analysis for Step 3)';
