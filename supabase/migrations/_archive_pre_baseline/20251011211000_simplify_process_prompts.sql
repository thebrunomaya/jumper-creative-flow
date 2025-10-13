-- Simplify process prompts by removing "Ações Típicas" section
-- Keep only "Métricas Prioritárias" for cleaner, more focused prompts

-- META ADS UPDATES
UPDATE j_ads_optimization_prompts
SET prompt_text = '📊 MÉTRICAS PRIORITÁRIAS:
- ROAS (Return on Ad Spend), em decimal (ex: 3.2x)
- CPA (Custo por Aquisição), em R$
- Taxa de conversão, em %
- AOV (Valor Médio do Pedido), em R$
- Custo total, em R$',
updated_at = NOW()
WHERE platform = 'meta' AND objective = 'Vendas' AND prompt_type = 'process';

UPDATE j_ads_optimization_prompts
SET prompt_text = '📊 MÉTRICAS PRIORITÁRIAS:
- CTR (Click-Through Rate), em %
- CPC (Custo por Clique), em R$
- Cliques no link, número absoluto
- Impressões, número absoluto
- Alcance único, número de pessoas',
updated_at = NOW()
WHERE platform = 'meta' AND objective = 'Tráfego' AND prompt_type = 'process';

UPDATE j_ads_optimization_prompts
SET prompt_text = '📊 MÉTRICAS PRIORITÁRIAS:
- CPL (Custo por Lead), em R$
- Leads gerados, número absoluto
- Taxa de conversão do formulário, em %
- Qualidade dos leads (MQL/SQL), em %
- Custo total, em R$',
updated_at = NOW()
WHERE platform = 'meta' AND objective = 'Leads' AND prompt_type = 'process';

UPDATE j_ads_optimization_prompts
SET prompt_text = '📊 MÉTRICAS PRIORITÁRIAS:
- Taxa de engajamento, em %
- Interações totais (curtidas, comentários, compartilhamentos), número absoluto
- Salvamentos, número absoluto
- Cliques no link, número absoluto
- Alcance, número de pessoas',
updated_at = NOW()
WHERE platform = 'meta' AND objective = 'Engajamento' AND prompt_type = 'process';

UPDATE j_ads_optimization_prompts
SET prompt_text = '📊 MÉTRICAS PRIORITÁRIAS:
- Alcance, número de pessoas
- Impressões, número absoluto
- Frequência, decimal (ex: 2.3)
- CPM (Custo por Mil Impressões), em R$
- Recall da marca, em %',
updated_at = NOW()
WHERE platform = 'meta' AND objective = 'Reconhecimento' AND prompt_type = 'process';

UPDATE j_ads_optimization_prompts
SET prompt_text = '📊 MÉTRICAS PRIORITÁRIAS:
- Pessoas alcançadas, número absoluto
- Impressões, número absoluto
- Frequência, decimal (ex: 1.8)
- CPM (Custo por Mil Impressões), em R$
- Alcance único, número de pessoas',
updated_at = NOW()
WHERE platform = 'meta' AND objective = 'Alcance' AND prompt_type = 'process';

UPDATE j_ads_optimization_prompts
SET prompt_text = '📊 MÉTRICAS PRIORITÁRIAS:
- ThruPlay (vídeos assistidos até o fim), número absoluto
- Taxa de retenção, em %
- Tempo médio de visualização, em segundos
- Visualizações de 3 segundos, número absoluto
- CPV (Custo por Visualização), em R$',
updated_at = NOW()
WHERE platform = 'meta' AND objective = 'Visualizações de Vídeo' AND prompt_type = 'process';

UPDATE j_ads_optimization_prompts
SET prompt_text = '📊 MÉTRICAS PRIORITÁRIAS:
- Conversas iniciadas, número absoluto
- Custo por conversa, em R$
- Taxa de resposta, em %
- Qualidade das conversas (intenção de compra), em %
- Custo total, em R$',
updated_at = NOW()
WHERE platform = 'meta' AND objective = 'Conversas' AND prompt_type = 'process';

UPDATE j_ads_optimization_prompts
SET prompt_text = '📊 MÉTRICAS PRIORITÁRIAS:
- Cadastros completos, número absoluto
- Custo por cadastro, em R$
- Taxa de conclusão do formulário, em %
- Qualidade dos cadastros, em %
- Custo total, em R$',
updated_at = NOW()
WHERE platform = 'meta' AND objective = 'Cadastros' AND prompt_type = 'process';

UPDATE j_ads_optimization_prompts
SET prompt_text = '📊 MÉTRICAS PRIORITÁRIAS:
- Novos seguidores, número absoluto
- Custo por seguidor, em R$
- Alcance, número de pessoas
- Taxa de engajamento, em %
- Impressões, número absoluto',
updated_at = NOW()
WHERE platform = 'meta' AND objective = 'Seguidores' AND prompt_type = 'process';

-- GOOGLE ADS UPDATES
UPDATE j_ads_optimization_prompts
SET prompt_text = '📊 MÉTRICAS PRIORITÁRIAS:
- ROAS (Return on Ad Spend), em decimal (ex: 4.1x)
- CPA (Custo por Aquisição), em R$
- Taxa de conversão, em %
- Valor de conversão médio, em R$
- Custo total, em R$',
updated_at = NOW()
WHERE platform = 'google' AND objective = 'Vendas' AND prompt_type = 'process';

UPDATE j_ads_optimization_prompts
SET prompt_text = '📊 MÉTRICAS PRIORITÁRIAS:
- CTR (Click-Through Rate), em %
- CPC (Custo por Clique), em R$
- Cliques, número absoluto
- Impressões, número absoluto
- Posição média do anúncio, decimal',
updated_at = NOW()
WHERE platform = 'google' AND objective = 'Tráfego' AND prompt_type = 'process';

UPDATE j_ads_optimization_prompts
SET prompt_text = '📊 MÉTRICAS PRIORITÁRIAS:
- CPL (Custo por Lead), em R$
- Conversões (leads), número absoluto
- Taxa de conversão, em %
- Qualidade dos leads, em %
- Custo total, em R$',
updated_at = NOW()
WHERE platform = 'google' AND objective = 'Leads' AND prompt_type = 'process';

UPDATE j_ads_optimization_prompts
SET prompt_text = '📊 MÉTRICAS PRIORITÁRIAS:
- Taxa de engajamento, em %
- Interações totais, número absoluto
- Visualizações de vídeo (YouTube), número absoluto
- CTR, em %
- Tempo médio de engajamento, em segundos',
updated_at = NOW()
WHERE platform = 'google' AND objective = 'Engajamento' AND prompt_type = 'process';

UPDATE j_ads_optimization_prompts
SET prompt_text = '📊 MÉTRICAS PRIORITÁRIAS:
- Impressões, número absoluto
- Alcance, número de pessoas
- Frequência, decimal (ex: 2.1)
- CPM (Custo por Mil Impressões), em R$
- Share of Voice, em %',
updated_at = NOW()
WHERE platform = 'google' AND objective = 'Reconhecimento' AND prompt_type = 'process';

UPDATE j_ads_optimization_prompts
SET prompt_text = '📊 MÉTRICAS PRIORITÁRIAS:
- Alcance único, número de pessoas
- Impressões, número absoluto
- Frequência, decimal (ex: 1.9)
- CPM (Custo por Mil Impressões), em R$
- Cobertura geográfica, em %',
updated_at = NOW()
WHERE platform = 'google' AND objective = 'Alcance' AND prompt_type = 'process';

UPDATE j_ads_optimization_prompts
SET prompt_text = '📊 MÉTRICAS PRIORITÁRIAS:
- Visualizações de vídeo, número absoluto
- Taxa de visualização, em %
- CPV (Custo por Visualização), em R$
- Tempo médio de visualização, em segundos
- Inscritos ganhos, número absoluto',
updated_at = NOW()
WHERE platform = 'google' AND objective = 'Visualizações de Vídeo' AND prompt_type = 'process';

UPDATE j_ads_optimization_prompts
SET prompt_text = '📊 MÉTRICAS PRIORITÁRIAS:
- Conversões de mensagem, número absoluto
- Custo por conversa, em R$
- Taxa de resposta, em %
- Chamadas telefônicas, número absoluto
- Custo total, em R$',
updated_at = NOW()
WHERE platform = 'google' AND objective = 'Conversas' AND prompt_type = 'process';

UPDATE j_ads_optimization_prompts
SET prompt_text = '📊 MÉTRICAS PRIORITÁRIAS:
- Cadastros, número absoluto
- Custo por cadastro, em R$
- Taxa de conclusão do formulário, em %
- Qualidade dos cadastros, em %
- Custo total, em R$',
updated_at = NOW()
WHERE platform = 'google' AND objective = 'Cadastros' AND prompt_type = 'process';

UPDATE j_ads_optimization_prompts
SET prompt_text = '📊 MÉTRICAS PRIORITÁRIAS:
- Inscritos ganhos (YouTube), número absoluto
- Custo por inscrito, em R$
- Taxa de crescimento, em %
- Visualizações de canal, número absoluto
- Engajamento médio, em %',
updated_at = NOW()
WHERE platform = 'google' AND objective = 'Seguidores' AND prompt_type = 'process';
