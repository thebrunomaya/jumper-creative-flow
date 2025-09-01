# 📊 Revisão de Dashboards - Equipe de Gestão de Tráfego

> **Instruções**: Revise cada dashboard, suas métricas e thresholds. Edite o arquivo `dashboard-config.json` com suas alterações e forneça de volta ao Claude para reprocessamento automático.

## 🎯 Status dos Dashboards

### ✅ Implementados e Funcionais
- **Vendas** - Funil de conversão e receita
- **Tráfego** - Geração de tráfego e cliques  
- **Engajamento** - Interações e vídeo
- **Leads** - Geração de leads qualificados
- **Reconhecimento de Marca** - Alcance e visibilidade
- **Alcance** - Cobertura de audiência
- **Reproduções de Vídeo** - Performance de vídeos
- **Conversões** - ROI e conversões

### ⏳ Em Desenvolvimento (Coming Soon)
- **Mensagens** - Conversas via chat
- **Catálogo de Produtos** - Vendas do catálogo
- **Visitas ao Estabelecimento** - Visitas físicas
- **Instalações do Aplicativo** - Downloads de app
- **Cadastros** - Registros de usuários
- **Seguidores** - Crescimento social

---

## 📋 Dashboards Implementados

### 💰 Dashboard de Vendas
**Objetivo**: Análise de funil de conversão e receita

#### Métricas Principais (Hero):
- **Receita** (Prioridade 10) - Receita total gerada
- **ROAS** (Prioridade 10) - Retorno sobre investimento
- **Conversões** (Prioridade 9) - Vendas realizadas

#### Thresholds Atuais:
- **ROAS**: Excelente ≥4.0x | Bom ≥2.5x | Atenção ≥1.0x
- **CPA**: Excelente ≤R$50 | Bom ≤R$100 | Atenção ≤R$200

---

### 🌐 Dashboard de Tráfego  
**Objetivo**: Análise de geração de tráfego e engajamento

#### Métricas Principais (Hero):
- **Cliques no Link** (Prioridade 10) - Tráfego direcionado
- **CPC** (Prioridade 10) - Custo por clique
- **CTR** (Prioridade 9) - Taxa de cliques

#### Thresholds Atuais:
- **CTR**: Excelente ≥2.0% | Bom ≥1.5% | Atenção ≥0.5%
- **CPC**: Excelente ≤R$0,50 | Bom ≤R$1,50 | Atenção ≤R$3,00

---

### 💬 Dashboard de Engajamento
**Objetivo**: Análise de interações e engajamento com conteúdo

#### Métricas Principais (Hero):
- **Total de Cliques** (Prioridade 10) - Interações totais
- **Vídeo 50% Assistido** (Prioridade 9) - Engajamento médio
- **Vídeo 75% Assistido** (Prioridade 9) - Engajamento alto

#### Thresholds Atuais:
- **Frequência**: Excelente 2-4x | Bom 1-2x ou 4-5x | Crítico >7x

---

### 🎯 Dashboard de Leads
**Objetivo**: Análise de geração e custo de leads qualificados

#### Métricas Principais (Hero):
- **Leads Gerados** (Prioridade 10) - Total de leads
- **Custo por Lead** (Prioridade 10) - CPA para leads

#### Thresholds Atuais:
- **CPA**: Excelente ≤R$50 | Bom ≤R$100 | Atenção ≤R$200
- **Taxa Conversão**: Excelente ≥3.0% | Bom ≥2.0% | Atenção ≥0.5%

---

### 🏢 Dashboard de Reconhecimento de Marca
**Objetivo**: Análise de alcance e visibilidade da marca

#### Métricas Principais (Hero):
- **Alcance** (Prioridade 10) - Pessoas únicas
- **Impressões** (Prioridade 10) - Visualizações totais
- **Frequência** (Prioridade 9) - Repetições por pessoa

#### Thresholds Atuais:
- **Frequência**: Excelente 3-7x | Bom 2-3x | Crítico >10x

---

### 📈 Dashboard de Alcance
**Objetivo**: Análise de expansão e cobertura de audiência

#### Métricas Principais (Hero):
- **Alcance Total** (Prioridade 10) - Cobertura máxima
- **CPM** (Prioridade 9) - Custo por mil impressões

---

### 🎥 Dashboard de Reproduções de Vídeo
**Objetivo**: Análise detalhada de performance de vídeos

#### Métricas Principais (Hero):
- **Visualizações de Vídeo** (Prioridade 10) - Reproduções totais
- **50% Assistido** (Prioridade 9) - Engajamento médio
- **75% Assistido** (Prioridade 9) - Engajamento alto

#### Métricas Calculadas:
- **Taxa de Retenção**: (100% assistido / visualizações) × 100

---

### 🔄 Dashboard de Conversões
**Objetivo**: Análise de conversões e retorno sobre investimento

#### Métricas Principais (Hero):
- **Total de Conversões** (Prioridade 10)
- **ROAS** (Prioridade 10)
- **CPA** (Prioridade 10)

---

## 🔧 Configurações Globais Atuais

### Períodos Disponíveis
- **Padrão**: 7 dias
- **Opções**: 7, 14, 30 dias

### Thresholds Gerais de Performance
- **CTR**: Excelente ≥2.0% | Bom ≥1.5% | Atenção ≥0.5%
- **ROAS**: Excelente ≥4.0x | Bom ≥2.5x | Atenção ≥1.0x  
- **CPA**: Excelente ≤R$50 | Bom ≤R$100 | Atenção ≤R$200
- **CPM**: Excelente ≤R$10 | Bom ≤R$20 | Atenção ≤R$40
- **Taxa Conversão**: Excelente ≥3.0% | Bom ≥2.0% | Atenção ≥0.5%

### Cores de Performance
- 🟢 **Excelente**: Verde
- 🔵 **Bom**: Azul
- 🟡 **Atenção**: Amarelo  
- 🔴 **Crítico**: Vermelho

---

## 📝 Para a Equipe de Gestão

### ✏️ Como Revisar:

1. **Abra** o arquivo `dashboard-config.json`
2. **Revise** cada dashboard e suas métricas
3. **Ajuste** prioridades (1-10) e marque métricas hero (true/false)
4. **Modifique** thresholds conforme sua experiência
5. **Adicione/Remova** métricas conforme necessidade
6. **Defina** métricas para dashboards "coming_soon"
7. **Forneça** o arquivo editado de volta ao Claude

### 🎯 Pontos de Atenção:

- **Prioridades**: 1 (baixa) a 10 (alta)
- **Hero Metrics**: Destacadas com tema laranja
- **Thresholds**: Definem as cores de performance
- **Database Fields**: Campos da tabela de dados reais

### 📊 Campos Disponíveis na Base:

- **Básicos**: impressions, clicks, link_clicks, spend, reach, frequency
- **Vídeo**: video_play_actions_video_view, video_p25/50/75/100_watched_actions_video_view
- **Conversão**: actions_onsite_conversion_post_save, action_values_omni_purchase

---

**Após revisão, forneça o arquivo `dashboard-config.json` editado para reprocessamento automático! 🚀**