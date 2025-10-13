-- Add 'analyze' prompts for Step 3 (Final insights generation)
-- These prompts define the "lens" for interpreting metrics based on account objective

-- ============================================
-- INSERT: META ADS - ANALYZE PROMPTS
-- ============================================

INSERT INTO j_ads_optimization_prompts (platform, objective, prompt_type, prompt_text) VALUES
('meta', 'Vendas', 'analyze', '🎯 LENTE DE ANÁLISE: VENDAS

O cliente contratou gestão de tráfego para AUMENTAR VENDAS e RECEITA.

FOCO DOS INSIGHTS:
- Eficiência de conversão (quantas vendas por investimento)
- Qualidade do funil (do clique até a compra)
- Retorno sobre investimento (ROAS, margem, lucratividade)
- Comportamento de compra (ticket médio, produtos mais vendidos)

MÉTRICAS-CHAVE PARA INTERPRETAR:
- ROAS: O cliente está ganhando ou perdendo dinheiro?
- CPA: Quanto custa conquistar cada cliente?
- Taxa de Conversão: O site/funil está preparado para converter?
- AOV/Ticket Médio: Qual o valor médio de cada venda?
- Receita Total: Quanto dinheiro entrou?

PERGUNTAS QUE O CLIENTE QUER RESPONDIDAS:
- Estou vendendo mais ou menos que antes?
- Meu investimento está dando retorno?
- Qual criativo/público está gerando mais vendas?
- Por que algumas campanhas convertem e outras não?
- O que preciso ajustar para vender mais?'),

('meta', 'Tráfego', 'analyze', '🎯 LENTE DE ANÁLISE: TRÁFEGO

O cliente contratou gestão de tráfego para AUMENTAR VISITAS ao site/página.

FOCO DOS INSIGHTS:
- Volume de cliques qualificados
- Custo por clique (eficiência do investimento)
- Qualidade do tráfego (taxa de rejeição, tempo no site)
- Alcance e impressões (quantas pessoas veem os anúncios)

MÉTRICAS-CHAVE PARA INTERPRETAR:
- Cliques no Link: Quantas pessoas visitaram o site?
- CPC: Quanto custa cada visita?
- CTR: Os anúncios são atrativos o suficiente?
- Impressões: Quantas pessoas viram os anúncios?
- Alcance: Qual o tamanho da audiência alcançada?

PERGUNTAS QUE O CLIENTE QUER RESPONDIDAS:
- Estou recebendo mais visitas no site?
- O custo por visita está dentro do esperado?
- Os anúncios estão atraindo cliques?
- Qual criativo/público gera mais tráfego?
- O tráfego está qualificado (pessoas certas)?'),

('meta', 'Leads', 'analyze', '🎯 LENTE DE ANÁLISE: LEADS

O cliente contratou gestão de tráfego para CAPTURAR CONTATOS qualificados.

FOCO DOS INSIGHTS:
- Volume de leads gerados
- Custo por lead (eficiência do investimento)
- Qualidade dos leads (MQL vs SQL, taxa de aproveitamento)
- Performance do formulário (taxa de preenchimento)

MÉTRICAS-CHAVE PARA INTERPRETAR:
- Leads Gerados: Quantos contatos foram capturados?
- CPL: Quanto custa cada lead?
- Taxa de Conversão do Formulário: O formulário está otimizado?
- Qualidade dos Leads: Os leads são qualificados?
- Custo Total: Qual o investimento para gerar essa base?

PERGUNTAS QUE O CLIENTE QUER RESPONDIDAS:
- Estou gerando leads suficientes?
- O custo por lead está viável?
- Os leads são qualificados (viram clientes)?
- Qual criativo/público gera melhores leads?
- O formulário está fácil de preencher?'),

('meta', 'Engajamento', 'analyze', '🎯 LENTE DE ANÁLISE: ENGAJAMENTO

O cliente contratou gestão de tráfego para AUMENTAR INTERAÇÕES com a marca.

FOCO DOS INSIGHTS:
- Volume de interações (curtidas, comentários, compartilhamentos)
- Taxa de engajamento (% de pessoas que interagiram)
- Qualidade das interações (comentários positivos, salvamentos)
- Alcance orgânico gerado pelo engajamento

MÉTRICAS-CHAVE PARA INTERPRETAR:
- Taxa de Engajamento: Qual % da audiência interagiu?
- Interações Totais: Volume de curtidas, comentários, shares
- Salvamentos: Quantos salvaram o conteúdo?
- Cliques no Link: Engajamento gerou tráfego?
- Alcance: Quantas pessoas viram o conteúdo?

PERGUNTAS QUE O CLIENTE QUER RESPONDIDAS:
- As pessoas estão interagindo com meu conteúdo?
- Qual tipo de post gera mais engajamento?
- Os comentários são positivos?
- O engajamento está gerando alcance orgânico?
- Qual público mais engaja com a marca?'),

('meta', 'Reconhecimento', 'analyze', '🎯 LENTE DE ANÁLISE: RECONHECIMENTO DE MARCA

O cliente contratou gestão de tráfego para AUMENTAR VISIBILIDADE da marca.

FOCO DOS INSIGHTS:
- Alcance (quantas pessoas diferentes viram a marca)
- Impressões (frequência de exposição)
- CPM (custo para alcançar mil pessoas)
- Share of Voice (presença da marca vs concorrentes)

MÉTRICAS-CHAVE PARA INTERPRETAR:
- Alcance: Quantas pessoas conheceram a marca?
- Impressões: Quantas vezes a marca foi vista?
- Frequência: Média de vezes que cada pessoa viu
- CPM: Custo para alcançar mil pessoas
- Recall da Marca: As pessoas lembram da marca?

PERGUNTAS QUE O CLIENTE QUER RESPONDIDAS:
- Mais pessoas estão conhecendo minha marca?
- A frequência está equilibrada (não cansativa)?
- O custo para gerar reconhecimento está viável?
- Qual criativo/mensagem mais impacta?
- Estou construindo presença de marca?'),

('meta', 'Alcance', 'analyze', '🎯 LENTE DE ANÁLISE: ALCANCE

O cliente contratou gestão de tráfego para EXPANDIR AUDIÊNCIA.

FOCO DOS INSIGHTS:
- Número de pessoas alcançadas (cobertura)
- Custo por mil pessoas alcançadas (CPM)
- Frequência de exposição
- Expansão de público vs saturação

MÉTRICAS-CHAVE PARA INTERPRETAR:
- Pessoas Alcançadas: Quantas pessoas únicas foram impactadas?
- Impressões: Volume total de exibições
- Frequência: Média de vezes que cada pessoa viu
- CPM: Custo para alcançar mil pessoas
- Alcance Único: Cobertura real da audiência

PERGUNTAS QUE O CLIENTE QUER RESPONDIDAS:
- Estou alcançando mais pessoas?
- O custo por mil está competitivo?
- A frequência está equilibrada?
- Estou saturando meu público ou expandindo?
- Qual segmento tem melhor alcance?'),

('meta', 'Visualizações de Vídeo', 'analyze', '🎯 LENTE DE ANÁLISE: VISUALIZAÇÕES DE VÍDEO

O cliente contratou gestão de tráfego para GERAR VISUALIZAÇÕES de vídeos.

FOCO DOS INSIGHTS:
- Volume de visualizações (3s, 25%, 50%, 75%, 100%)
- Taxa de retenção (quantos assistem até o fim)
- Tempo médio de visualização
- Custo por visualização (CPV)

MÉTRICAS-CHAVE PARA INTERPRETAR:
- ThruPlay: Quantos assistiram até o fim?
- Taxa de Retenção: O vídeo prende atenção?
- Tempo Médio de Visualização: Média de segundos assistidos
- Visualizações de 3 Segundos: Volume inicial
- CPV: Custo por visualização

PERGUNTAS QUE O CLIENTE QUER RESPONDIDAS:
- As pessoas estão assistindo meus vídeos?
- O conteúdo prende atenção até o fim?
- O custo por visualização está viável?
- Qual vídeo/criativo performa melhor?
- Onde as pessoas param de assistir?'),

('meta', 'Conversas', 'analyze', '🎯 LENTE DE ANÁLISE: CONVERSAS

O cliente contratou gestão de tráfego para GERAR CONVERSAS diretas com potenciais clientes.

FOCO DOS INSIGHTS:
- Volume de conversas iniciadas (WhatsApp/Messenger)
- Custo por conversa
- Taxa de resposta e qualificação
- Intenção de compra nas conversas

MÉTRICAS-CHAVE PARA INTERPRETAR:
- Conversas Iniciadas: Quantas pessoas entraram em contato?
- Custo por Conversa: Quanto custa cada contato?
- Taxa de Resposta: As conversas são respondidas?
- Qualidade das Conversas: Há intenção de compra?
- Mensagens: Volume de interações

PERGUNTAS QUE O CLIENTE QUER RESPONDIDAS:
- Estou gerando conversas qualificadas?
- O custo por conversa está viável?
- As pessoas estão interessadas (intenção de compra)?
- Qual criativo/público gera melhores conversas?
- As conversas estão virando vendas?'),

('meta', 'Cadastros', 'analyze', '🎯 LENTE DE ANÁLISE: CADASTROS

O cliente contratou gestão de tráfego para CAPTURAR CADASTROS completos.

FOCO DOS INSIGHTS:
- Volume de cadastros concluídos
- Custo por cadastro
- Taxa de conclusão do formulário
- Qualidade dos cadastros (dados completos)

MÉTRICAS-CHAVE PARA INTERPRETAR:
- Cadastros Completos: Quantos formulários foram finalizados?
- Custo por Cadastro: Quanto custa cada cadastro?
- Taxa de Conclusão: Quantos começam e terminam?
- Qualidade dos Cadastros: Os dados são válidos?
- Custo Total: Investimento para gerar essa base

PERGUNTAS QUE O CLIENTE QUER RESPONDIDAS:
- Estou capturando cadastros suficientes?
- O custo por cadastro está dentro do esperado?
- O formulário está otimizado (conclusão alta)?
- Os cadastros são qualificados?
- Qual criativo/público converte melhor?'),

('meta', 'Seguidores', 'analyze', '🎯 LENTE DE ANÁLISE: SEGUIDORES

O cliente contratou gestão de tráfego para CRESCER BASE DE SEGUIDORES.

FOCO DOS INSIGHTS:
- Crescimento de seguidores (volume)
- Custo por seguidor
- Taxa de engajamento dos novos seguidores
- Qualidade da audiência construída

MÉTRICAS-CHAVE PARA INTERPRETAR:
- Novos Seguidores: Quantos seguiram a página?
- Custo por Seguidor: Quanto custa cada seguidor?
- Taxa de Engajamento: Os seguidores interagem?
- Alcance de Seguidores: Qual o alcance da base?
- Crescimento de Audiência: Evolução da comunidade

PERGUNTAS QUE O CLIENTE QUER RESPONDIDAS:
- Estou crescendo minha base de seguidores?
- O custo por seguidor está competitivo?
- Os seguidores são engajados (não mortos)?
- Qual conteúdo atrai mais seguidores?
- A audiência construída é qualificada?');

-- ============================================
-- INSERT: GOOGLE ADS - ANALYZE PROMPTS
-- ============================================

INSERT INTO j_ads_optimization_prompts (platform, objective, prompt_type, prompt_text) VALUES
('google', 'Vendas', 'analyze', '🎯 LENTE DE ANÁLISE: VENDAS

O cliente contratou gestão de tráfego para AUMENTAR VENDAS e RECEITA.

FOCO DOS INSIGHTS:
- Eficiência de conversão (quantas vendas por investimento)
- Retorno sobre investimento (ROAS, margem, lucratividade)
- Performance de campanhas Shopping/Performance Max
- Qualidade do tráfego de busca (termos de pesquisa)

MÉTRICAS-CHAVE PARA INTERPRETAR:
- ROAS: O cliente está ganhando ou perdendo dinheiro?
- CPA: Quanto custa conquistar cada cliente?
- Conversões: Quantas vendas foram geradas?
- Valor de Conversão: Qual a receita total gerada?
- Taxa de Conversão: O site está preparado para converter?

PERGUNTAS QUE O CLIENTE QUER RESPONDIDAS:
- Estou vendendo mais ou menos que antes?
- Meu investimento está dando retorno?
- Qual campanha/palavra-chave gera mais vendas?
- Por que algumas campanhas convertem e outras não?
- O que preciso ajustar para vender mais?'),

('google', 'Tráfego', 'analyze', '🎯 LENTE DE ANÁLISE: TRÁFEGO

O cliente contratou gestão de tráfego para AUMENTAR VISITAS ao site/página.

FOCO DOS INSIGHTS:
- Volume de cliques qualificados
- Custo por clique (eficiência do investimento)
- Qualidade do tráfego (termos de pesquisa relevantes)
- Índice de qualidade e posição dos anúncios

MÉTRICAS-CHAVE PARA INTERPRETAR:
- Cliques: Quantas pessoas visitaram o site?
- CPC: Quanto custa cada visita?
- CTR: Os anúncios são atrativos o suficiente?
- Impressões: Quantas pessoas viram os anúncios?
- Posição Média: Os anúncios aparecem bem posicionados?

PERGUNTAS QUE O CLIENTE QUER RESPONDIDAS:
- Estou recebendo mais visitas no site?
- O custo por visita está dentro do esperado?
- Os anúncios estão atraindo cliques?
- Qual campanha/palavra-chave gera mais tráfego?
- O tráfego está qualificado (termos relevantes)?'),

('google', 'Leads', 'analyze', '🎯 LENTE DE ANÁLISE: LEADS

O cliente contratou gestão de tráfego para CAPTURAR CONTATOS qualificados.

FOCO DOS INSIGHTS:
- Volume de leads gerados
- Custo por lead (eficiência do investimento)
- Qualidade dos leads (taxa de aproveitamento)
- Performance de extensões de formulário

MÉTRICAS-CHAVE PARA INTERPRETAR:
- CPL: Quanto custa cada lead?
- Conversões de Lead: Quantos leads foram capturados?
- Taxa de Conversão: O formulário está otimizado?
- Qualidade dos Leads: Os leads são qualificados?
- Custo Total: Qual o investimento para gerar essa base?

PERGUNTAS QUE O CLIENTE QUER RESPONDIDAS:
- Estou gerando leads suficientes?
- O custo por lead está viável?
- Os leads são qualificados (viram clientes)?
- Qual campanha/palavra-chave gera melhores leads?
- O formulário está fácil de preencher?'),

('google', 'Engajamento', 'analyze', '🎯 LENTE DE ANÁLISE: ENGAJAMENTO

O cliente contratou gestão de tráfego para AUMENTAR INTERAÇÕES (YouTube/Display).

FOCO DOS INSIGHTS:
- Volume de interações (YouTube/Display)
- Taxa de engajamento
- Visualizações de vídeo e tempo de engajamento
- Performance de campanhas Discovery

MÉTRICAS-CHAVE PARA INTERPRETAR:
- Taxa de Engajamento: Qual % da audiência interagiu?
- Interações Totais: Volume de engajamentos
- Visualizações de Vídeo: Quantos assistiram?
- CTR de Engajamento: Engajamento gerou cliques?
- Tempo Médio de Engajamento: Duração das interações

PERGUNTAS QUE O CLIENTE QUER RESPONDIDAS:
- As pessoas estão interagindo com meu conteúdo?
- Qual tipo de anúncio gera mais engajamento?
- O engajamento está gerando cliques/conversões?
- Qual público mais engaja com a marca?
- Os vídeos do YouTube estão performando?'),

('google', 'Reconhecimento', 'analyze', '🎯 LENTE DE ANÁLISE: RECONHECIMENTO DE MARCA

O cliente contratou gestão de tráfego para AUMENTAR VISIBILIDADE da marca.

FOCO DOS INSIGHTS:
- Alcance (quantas pessoas diferentes viram a marca)
- Impressões (frequência de exposição)
- CPM (custo para alcançar mil pessoas)
- Brand lift (aumento de reconhecimento)

MÉTRICAS-CHAVE PARA INTERPRETAR:
- Impressões: Quantas vezes a marca foi vista?
- Alcance: Quantas pessoas conheceram a marca?
- Frequência: Média de vezes que cada pessoa viu
- CPM: Custo para alcançar mil pessoas
- Share of Voice: Presença da marca vs concorrentes

PERGUNTAS QUE O CLIENTE QUER RESPONDIDAS:
- Mais pessoas estão conhecendo minha marca?
- A frequência está equilibrada (não cansativa)?
- O custo para gerar reconhecimento está viável?
- Qual campanha/criativo mais impacta?
- Estou construindo presença de marca?'),

('google', 'Alcance', 'analyze', '🎯 LENTE DE ANÁLISE: ALCANCE

O cliente contratou gestão de tráfego para EXPANDIR AUDIÊNCIA (Display/YouTube).

FOCO DOS INSIGHTS:
- Número de pessoas alcançadas (cobertura)
- Custo por mil pessoas alcançadas (CPM)
- Frequência de exposição
- Cobertura geográfica

MÉTRICAS-CHAVE PARA INTERPRETAR:
- Alcance Único: Quantas pessoas únicas foram impactadas?
- Impressões: Volume total de exibições
- Frequência: Média de vezes que cada pessoa viu
- CPM: Custo para alcançar mil pessoas
- Cobertura Geográfica: Expansão territorial

PERGUNTAS QUE O CLIENTE QUER RESPONDIDAS:
- Estou alcançando mais pessoas?
- O custo por mil está competitivo?
- A frequência está equilibrada?
- Estou saturando meu público ou expandindo?
- Qual região/segmento tem melhor alcance?'),

('google', 'Visualizações de Vídeo', 'analyze', '🎯 LENTE DE ANÁLISE: VISUALIZAÇÕES DE VÍDEO (YOUTUBE)

O cliente contratou gestão de tráfego para GERAR VISUALIZAÇÕES de vídeos no YouTube.

FOCO DOS INSIGHTS:
- Volume de visualizações
- Taxa de visualização (view rate)
- Tempo médio de visualização
- Custo por visualização (CPV)
- Inscritos ganhos

MÉTRICAS-CHAVE PARA INTERPRETAR:
- Visualizações de Vídeo: Quantos assistiram?
- Taxa de Visualização: % de impressões que viraram views
- CPV: Custo por visualização
- Tempo Médio de Visualização: Média de segundos assistidos
- Inscritos Ganhos: Crescimento do canal

PERGUNTAS QUE O CLIENTE QUER RESPONDIDAS:
- As pessoas estão assistindo meus vídeos?
- O conteúdo prende atenção até o fim?
- O custo por visualização está viável?
- Qual vídeo/campanha performa melhor?
- Estou ganhando inscritos no canal?'),

('google', 'Conversas', 'analyze', '🎯 LENTE DE ANÁLISE: CONVERSAS

O cliente contratou gestão de tráfego para GERAR CHAMADAS/MENSAGENS diretas.

FOCO DOS INSIGHTS:
- Volume de conversões de mensagem/chamada
- Custo por conversa
- Taxa de resposta e qualificação
- Performance de extensões de chamada

MÉTRICAS-CHAVE PARA INTERPRETAR:
- Conversões de Mensagem: Quantas mensagens foram geradas?
- Custo por Conversa: Quanto custa cada contato?
- Taxa de Resposta: As conversas são respondidas?
- Chamadas Telefônicas: Volume de calls
- Custo Total: Investimento em conversas

PERGUNTAS QUE O CLIENTE QUER RESPONDIDAS:
- Estou gerando conversas/chamadas qualificadas?
- O custo por conversa está viável?
- As pessoas estão interessadas (intenção de compra)?
- Qual campanha gera melhores conversas?
- As conversas estão virando vendas?'),

('google', 'Cadastros', 'analyze', '🎯 LENTE DE ANÁLISE: CADASTROS

O cliente contratou gestão de tráfego para CAPTURAR CADASTROS completos.

FOCO DOS INSIGHTS:
- Volume de cadastros concluídos
- Custo por cadastro
- Taxa de conclusão do formulário
- Performance de extensões de formulário

MÉTRICAS-CHAVE PARA INTERPRETAR:
- Cadastros: Quantos formulários foram finalizados?
- Custo por Cadastro: Quanto custa cada cadastro?
- Taxa de Conclusão: Quantos começam e terminam?
- Qualidade dos Cadastros: Os dados são válidos?
- Custo Total: Investimento para gerar essa base

PERGUNTAS QUE O CLIENTE QUER RESPONDIDAS:
- Estou capturando cadastros suficientes?
- O custo por cadastro está dentro do esperado?
- O formulário está otimizado (conclusão alta)?
- Os cadastros são qualificados?
- Qual campanha converte melhor?'),

('google', 'Seguidores', 'analyze', '🎯 LENTE DE ANÁLISE: SEGUIDORES (YOUTUBE)

O cliente contratou gestão de tráfego para CRESCER INSCRITOS NO CANAL.

FOCO DOS INSIGHTS:
- Crescimento de inscritos (volume)
- Custo por inscrito
- Taxa de crescimento do canal
- Engajamento dos inscritos (visualizações médias)

MÉTRICAS-CHAVE PARA INTERPRETAR:
- Inscritos Ganhos: Quantos se inscreveram no canal?
- Custo por Inscrito: Quanto custa cada inscrito?
- Taxa de Crescimento: Evolução percentual
- Visualizações de Canal: Alcance do conteúdo
- Engajamento Médio: Interação dos inscritos

PERGUNTAS QUE O CLIENTE QUER RESPONDIDAS:
- Estou crescendo meu canal do YouTube?
- O custo por inscrito está competitivo?
- Os inscritos são engajados (assistem vídeos)?
- Qual vídeo/campanha atrai mais inscritos?
- A audiência construída é qualificada?');

-- Add comment explaining analyze prompts
COMMENT ON COLUMN j_ads_optimization_prompts.prompt_type IS
'Prompt types: transcribe (Whisper context for Step 1), process (Claude bullet organization for Step 2), analyze (Claude insight generation for Step 3 - lens based on account objective)';
