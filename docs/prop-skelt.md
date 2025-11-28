# Proposta Comercial
## Arquitetura de Tracking Server-Side

---

**Para:** Renato Roschel — Skelt, Creamy, TJL
**De:** Jumper Studio
**Data:** Novembro/2025
**Validade:** 15 dias

---

## Sobre a Jumper Studio

A Jumper Studio é uma agência de performance marketing especializada em escalar e-commerces através de mídia paga e infraestrutura de dados.

Com uma equipe de mais de 15 profissionais especializados gerenciando mais de 1 milhão de dólares mensais em mídia paga (Google Ads, Meta Ads, Programática), somos especializados arquitetura de tracking e estratégia de crescimento para e-commerce e digitalização de negócios.

Nosso diferencial está em entender que performance sustentável começa com dados confiáveis. Por isso, desenvolvemos expertise em arquitetura de tracking server-side, garantindo que nossos clientes tomem decisões baseadas em informações precisas.

---

## Contexto

As marcas Creamy, Skelt e TJL operam como e-commerces nativos digitais em plataforma VTEX, com forte presença em mídia paga e influenciadores.

O cenário atual de tracking apresenta desafios significativos que impactam diretamente a performance das campanhas:

**Perda de dados por bloqueadores e restrições de privacidade.** Ad blockers afetam entre 20-30% dos usuários, impedindo que pixels disparem. Restrições do iOS 14+ e Safari limitam cookies de terceiros a 7 dias, quebrando a atribuição de compras com ciclos mais longos.

**Checkout VTEX em domínio separado.** A arquitetura padrão da VTEX roda o checkout em subdomínio diferente da loja, o que pode quebrar a continuidade da sessão do usuário e comprometer eventos críticos como InitiateCheckout e Purchase.

**Falta de padronização entre as marcas.** Sem uma taxonomia unificada de eventos, fica difícil consolidar dados e comparar performance entre Creamy, Skelt e TJL.

**Impacto direto na performance.** Algoritmos de otimização como Advantage+ (Meta) e Performance Max (Google) trabalham com dados incompletos, resultando em CPA mais alto e dificuldade para escalar mídia com confiança.

---

## Solução Proposta

Implementação de uma arquitetura completa de tracking server-side, padronizada entre as três marcas e preparada para o cenário de privacidade atual e futuro.

A solução utiliza GTM Server-Side como camada intermediária entre os sites e as plataformas de ads. Em vez de o browser do usuário enviar dados diretamente para Meta e Google, os eventos passam primeiro por um servidor próprio (via subdomínios como tracking.creamy.com.br), garantindo:

**Bypass de ad blockers.** O tráfego server-side parece tráfego interno do site, não sendo bloqueado.

**Cookies first-party.** Os cookies são definidos pelo próprio domínio, não por terceiros, eliminando as restrições de Safari e iOS.

**Controle total sobre os dados.** É possível enriquecer informações, garantir deduplicação correta e manter qualidade consistente do sinal enviado às plataformas.

**Melhoria no Event Match Quality.** Dados mais completos e confiáveis resultam em melhor matching de usuários pelo Meta e Google, otimizando a performance das campanhas.

---

## Escopo Técnico

### GTM Web (3 sites + Quiz)

- Auditoria do setup atual e identificação de conflitos
- Remoção/desativação de apps nativos VTEX que conflitem com a implementação
- Configuração padronizada do GTM Web Container
- DataLayer customizado para estrutura VTEX
- Cross-domain tracking entre loja e checkout
- Nomenclatura unificada de eventos entre as três marcas

### GTM Server-Side

- Setup do container GTM Server-Side
- Configuração de domínio customizado por marca:
  - tracking.creamy.com.br
  - tracking.skelt.com.br
  - tracking.tjl.com.br
- Cookies first-party para bypass de restrições iOS/Safari
- Regras anti-bloqueio de ad blockers
- Roteamento seguro de eventos

**Hospedagem recomendada:** Stape.io. Oferece setup simplificado, custo previsível (~$20-50/mês por container) e manutenção mínima, sendo mais pragmático que implementações diretas em Google Cloud Platform ou AWS para este porte de operação. O custo de hosting fica por conta do cliente.

### Meta Ads

**Pixel Web — Eventos implementados:**
- PageView
- ViewContent (produto)
- Search
- AddToCart
- InitiateCheckout
- AddPaymentInfo
- Purchase (com currency, value, IDs, items)

**Conversions API (Server-Side):**
- Integração via GTM Server-Side
- Deduplicação automática de eventos (web + server)
- Hashing de dados first-party (email, phone, external_id)
- Payload completo com parâmetros avançados
- Validação via Events Manager

### Google Ads + GA4

**GA4 E-commerce Completo:**
- view_item
- add_to_cart
- begin_checkout
- add_payment_info
- purchase
- view_promotion / select_promotion

**Google Ads:**
- Conversões importadas do GA4
- Enhanced Conversions configurado e validado
- Conversion API via GTM Server-Side
- Deduplicação de eventos

### Quiz Creamy

**Eventos rastreados:**
- PageView (landing)
- Start Quiz
- Step Events (passo a passo)
- Quiz Completed
- Lead Captured (com hashing de dados first-party)
- Redirect / Offer Page Visit

**Plataformas integradas:**
- Meta Ads (Pixel + CAPI)
- Google Ads / GA4
- Server-Side para ambos

O objetivo é garantir atribuição completa do lead gerado até eventual conversão no e-commerce.

---

## Entregáveis

**Implementação:**
- GTM Web Container configurado (3 sites + quiz)
- GTM Server-Side Container configurado
- Meta Pixel + CAPI funcionais
- GA4 E-commerce completo
- Google Ads Enhanced Conversions
- Quiz tracking completo
- Deduplicação 100% funcional em todas as plataformas

**Documentação:**
- Documentação técnica completa (PDF + Notion)
- Taxonomia de eventos padronizada
- Mapa de parâmetros por plataforma

**Validação:**
- Testes via Tag Assistant, Meta Events Manager e GA4 DebugView
- QA completo antes da entrega final

**Suporte:**
- 30 dias de suporte pós-implementação
- Correções ilimitadas dentro do escopo contratado

---

## Metodologia e Prazo

**Prazo total: 20 dias úteis** a partir da aprovação e liberação de acessos.

| Fase | Descrição | Período |
|------|-----------|---------|
| Auditoria | Análise do setup atual, mapeamento de conflitos, acesso às plataformas | Dias 1-3 |
| Arquitetura | Desenho da solução e aprovação do cliente | Dias 4-6 |
| Implementação Web | GTM Web nos 3 sites + quiz, DataLayer VTEX, cross-domain | Dias 7-12 |
| Implementação Server-Side | Setup sGTM, Meta CAPI, GA4 Server-Side, Enhanced Conversions | Dias 13-16 |
| QA + Documentação | Testes completos, validação em todas as plataformas, documentação técnica | Dias 17-20 |

---

## Investimento

### Escopo Principal
**3 E-commerces (Creamy, Skelt, TJL) + Quiz Creamy**

| Condição de Pagamento | Valor |
|-----------------------|-------|
| Parcelado em 4x | R$ 12.000 (4x de R$ 3.000) |
| À vista | R$ 10.200 (15% de desconto) |

### O que está incluído:
- GTM Web + Server-Side
- Meta Ads (Pixel + CAPI)
- GA4 + Enhanced Conversions
- Google Ads Conversion Tracking
- Quiz Tracking Completo
- Documentação Técnica
- 30 dias de suporte pós-implementação
- Revisões ilimitadas dentro do escopo

---

## Add-on Opcional

### TikTok Ads Tracking
**+ R$ 3.000**

- TikTok Pixel Web (3 sites)
- Eventos padrão de e-commerce (ViewContent, AddToCart, InitiateCheckout, Purchase)
- Events API via GTM Server-Side
- Validação no TikTok Events Manager

**Recomendação:** Se TikTok é ou será um canal relevante na estratégia de mídia, recomendamos incluir neste momento para aproveitar a infraestrutura server-side que estará sendo implementada.

---

## O Que Não Está Incluído

- Integração com BigQuery
- Criação de dashboards customizados
- Gestão ou otimização de campanhas de mídia
- Desenvolvimento de features na plataforma VTEX além do tracking
- Hosting do GTM Server-Side (custo Stape: ~$20-50/mês por container, por conta do cliente)
- Acesso e configuração de DNS (orientamos o processo, mas a execução depende do cliente)

---

## Resultados Esperados

**Curto prazo (30 dias):**
- Recuperação de 20-40% de eventos perdidos via server-side
- Event Match Quality (Meta) acima de 7
- Dados consistentes e padronizados entre as 3 marcas

**Médio prazo (60-90 dias):**
- Melhoria na performance do Advantage+ (Meta) e Performance Max (Google)
- Redução de CPA pela melhor qualidade de sinal
- Atribuição mais precisa entre canais

**Longo prazo:**
- Base sólida para escalar mídia com confiança
- Infraestrutura preparada para cenário sem cookies de terceiros
- Governança de dados para auditoria e integração com CRM

---

## Próximos Passos

Para iniciar o projeto, precisamos de:

1. **Aprovação desta proposta**

2. **Liberação dos acessos:**
   - GTM (Web e Server, se existente)
   - Google Analytics 4
   - Meta Business Manager / Events Manager
   - Google Ads
   - VTEX Admin (3 lojas)
   - Acesso ao DNS das marcas (para configuração dos subdomínios de tracking)

3. **Pagamento da primeira parcela** (ou valor à vista com desconto)

4. **Kick-off** — Reunião de alinhamento inicial e definição do cronograma detalhado

---

## Contato

**Jumper Studio**

Bruno Maya
Diretor Comercial

[bruno@jumper.studio]
[21976116703]
[jumper.studio]

---

*Esta proposta tem validade de 15 dias a partir da data de envio.*