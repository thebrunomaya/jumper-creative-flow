# Roadmap: Top Criativos - Imagens e Vídeos

> **Última atualização:** 2024-12-11
> **Status:** Em desenvolvimento
> **Versão atual:** v2.1.82

---

## Resumo Executivo

A seção "Top 3 Criativos" foi implementada no SalesDashboard (v2.1.82), mas as imagens não estão aparecendo corretamente. Diagnóstico revelou que Windsor não retorna `image_url` para todos os anúncios, e URLs da Meta expiram em 24-72h.

---

## Estado Atual

### O que foi implementado (v2.1.82)

| Componente | Status | Arquivo |
|------------|--------|---------|
| TopCreativeCard | ✅ Completo | `src/components/dashboards/TopCreativeCard.tsx` |
| TopCreativesSection | ✅ Completo | `src/components/dashboards/TopCreativesSection.tsx` |
| useTopCreatives hook | ✅ Completo | `src/hooks/useTopCreatives.ts` |
| creativeRankingMetrics | ✅ Completo | `src/utils/creativeRankingMetrics.ts` |
| Integração SalesDashboard | ✅ Completo | `src/components/dashboards/SalesDashboard.tsx` |
| Migration novos campos | ✅ Aplicada | `supabase/migrations/20251211224407_add_creative_fields_to_bronze.sql` |

### Campos adicionados ao banco

```sql
-- Campos de criativo
body TEXT                    -- Texto principal do anúncio
title TEXT                   -- Título/headline
link TEXT                    -- URL de destino
thumbnail_url TEXT           -- Thumbnail de vídeos
media_type TEXT              -- IMAGE/VIDEO/CAROUSEL

-- Campos de campanha (pedido do gestor)
campaign_daily_budget NUMERIC(12,2)
campaign_status TEXT
action_values_add_to_cart NUMERIC(10,2)
```

### Query Windsor atualizada

Arquivo de referência: `_tmp-bruno/windsor-query-atualizada.txt`

**Novos campos adicionados:**
- `body`, `title`, `link`, `thumbnail_url`
- `campaign_daily_budget`, `campaign_status`, `action_values_add_to_cart`

**Status:** Aguardando próxima execução do Windsor para popular dados.

---

## Problema Identificado

### Diagnóstico (Query de debug)

```sql
SELECT ad_id, ad_name, image_url, thumbnail_url
FROM j_rep_metaads_bronze
WHERE account_id = 'XXX' AND spend::numeric > 0
LIMIT 5;
```

**Resultado:** 4 de 5 anúncios com `image_url: null`

### Causas

1. **Windsor não retorna `image_url` para todos os formatos:**
   - Anúncios de vídeo → só têm `thumbnail_url`
   - Anúncios dinâmicos → podem não ter
   - Carrosséis → comportamento inconsistente

2. **URLs da Meta expiram em 24-72 horas:**
   - Mesmo quando disponível, URL para de funcionar após dias
   - Política de segurança/privacidade da Meta

3. **Campos novos ainda sem dados:**
   - `thumbnail_url`, `body`, `title` foram adicionados
   - Windsor precisa rodar com query atualizada

---

## Solução Proposta

### Fase 1: Aguardar Windsor (Imediato)

**Ação:** Nenhuma - apenas aguardar

- [ ] Query Windsor atualizada já foi configurada
- [ ] Próxima execução vai popular `thumbnail_url`, `body`, `title`, `media_type`
- [ ] Verificar se melhora a cobertura de imagens

**Prazo:** Próxima execução do Windsor (diária?)

---

### Fase 2: Fallback Inteligente (Curto prazo)

**Objetivo:** Melhorar UX mesmo sem imagem

**Implementar:**

1. **Prioridade de imagem:**
   ```typescript
   const imageUrl = creative.thumbnail_url || creative.image_url || null;
   ```

2. **Placeholder por tipo de mídia:**
   - VIDEO → Ícone de play + cor de fundo
   - CAROUSEL → Ícone de carrossel
   - IMAGE sem URL → Placeholder genérico

3. **Badge de tipo de mídia** (já implementado)

**Arquivos a modificar:**
- `src/components/dashboards/TopCreativeCard.tsx`

---

### Fase 3: Persistência de Imagens (Médio prazo)

**Objetivo:** URLs permanentes que nunca expiram

#### Arquitetura

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Windsor Sync   │────▶│  Edge Function   │────▶│ Supabase Storage│
│  (image_url)    │     │  download-image  │     │ creative-images/│
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌──────────────────┐
                        │ j_rep_metaads_   │
                        │ bronze           │
                        │ (stored_image_url)│
                        └──────────────────┘
```

#### Componentes a criar

1. **Edge Function: `download-creative-image`**
   ```typescript
   // Input: image_url temporária da Meta
   // Output: URL permanente do Supabase Storage

   async function downloadAndStore(imageUrl: string, adId: string) {
     const response = await fetch(imageUrl);
     const blob = await response.blob();

     const { data } = await supabase.storage
       .from('creative-images')
       .upload(`${adId}.jpg`, blob);

     return supabase.storage
       .from('creative-images')
       .getPublicUrl(`${adId}.jpg`);
   }
   ```

2. **Novo campo no banco:**
   ```sql
   ALTER TABLE j_rep_metaads_bronze
   ADD COLUMN stored_image_url TEXT;
   ```

3. **Trigger ou Cron Job:**
   - Opção A: Trigger on INSERT → processa imediatamente
   - Opção B: Cron diário → processa em batch

4. **Bucket no Supabase Storage:**
   ```
   creative-images/
   ├── {ad_id_1}.jpg
   ├── {ad_id_2}.jpg
   └── ...
   ```

#### Estimativa de Storage

- ~50KB por imagem média
- 1000 anúncios = ~50MB
- 10000 anúncios = ~500MB
- Custo Supabase: incluído no plano até 1GB

---

### Fase 4: Rollout para outros Dashboards (Após validação)

Após validar no SalesDashboard, integrar em:

- [ ] TrafficDashboard.tsx
- [ ] LeadsDashboard.tsx
- [ ] EngagementDashboard.tsx
- [ ] BrandAwarenessDashboard.tsx
- [ ] ReachDashboard.tsx
- [ ] VideoViewsDashboard.tsx
- [ ] ConversionsDashboard.tsx
- [ ] SeguidoresDashboard.tsx
- [ ] ConversasDashboard.tsx
- [ ] CadastrosDashboard.tsx
- [ ] GeneralDashboard.tsx

---

## Próxima Sessão: Checklist

### Verificações iniciais

1. [ ] Windsor rodou com query atualizada?
   ```sql
   SELECT COUNT(*) FROM j_rep_metaads_bronze
   WHERE thumbnail_url IS NOT NULL;
   ```

2. [ ] Novos campos estão populados?
   ```sql
   SELECT body, title, media_type, thumbnail_url
   FROM j_rep_metaads_bronze
   WHERE date = CURRENT_DATE - 1
   LIMIT 5;
   ```

### Se dados novos disponíveis

3. [ ] Testar cobertura de imagens melhorou
4. [ ] Implementar Fase 2 (fallback inteligente)
5. [ ] Avaliar necessidade da Fase 3

### Se dados ainda não disponíveis

3. [ ] Verificar configuração Windsor
4. [ ] Implementar Fase 2 como mitigação
5. [ ] Planejar Fase 3 em paralelo

---

## Referências

- **Query Windsor:** `_tmp-bruno/windsor-query-atualizada.txt`
- **Migration:** `supabase/migrations/20251211224407_add_creative_fields_to_bronze.sql`
- **Plano original:** `.claude/plans/noble-petting-key.md`

---

## Decisões Pendentes

1. **Trigger vs Cron para download de imagens?**
   - Trigger: Imediato, mas pode impactar performance do sync
   - Cron: Batch processing, mais eficiente, delay de até 24h

2. **Formato de armazenamento?**
   - Original (JPG/PNG/WebP) vs conversão para WebP
   - WebP economiza ~30% storage mas requer processamento

3. **Política de retenção?**
   - Manter imagens de anúncios antigos?
   - Cleanup após X dias sem veiculação?
