# Context Summary - Top Criativos Visual Refinement

## Current Status
- **Project**: Jumper Flow - Creative Performance System
- **Phase**: Visual refinement of TopCreativeCard
- **Task**: Improve card appearance before rollout to other dashboards
- **Version**: v2.1.89

## Completed Work

### Fase 1: Top Criativos (100%)
- `TopCreativeCard.tsx` - Card with medals 🥇🥈🥉
- `TopCreativesSection.tsx` - Section wrapper
- `useTopCreatives.ts` - Data hook with aggregation
- `creativeRankingMetrics.ts` - Metric configs per objective
- Integrated in SalesDashboard

### Fase 2: Thumbnails Permanentes (100%)
- Supabase Storage bucket `criativos`
- Edge Function `sync-creative-thumbnails`
- Cron job daily at 6h BRT (9h UTC)
- 377/377 thumbnails synced

### Special Features
- Catalog detection via `{{product.name}}` templates
- Purple "Catálogo" badge with ShoppingBag icon
- Astronaut placeholder for catalogs (`/images/catalog-placeholder.png`)
- Fallback chain: `thumbnail_storage_url` → `thumbnail_url` → `image_url`

## Key Files for Visual Refinement

```
src/components/dashboards/TopCreativeCard.tsx    # Main card component
src/components/dashboards/TopCreativesSection.tsx # Section wrapper
src/utils/creativeRankingMetrics.ts              # Metric formatting
public/images/catalog-placeholder.png            # Catalog placeholder
```

## Current Card Structure

```tsx
<Card>
  {/* Rank Badge - 🥇🥈🥉 + media type badge */}
  <div className="px-3 py-2 border-b">...</div>

  {/* Image - aspect-[4/5] */}
  <div className="relative aspect-[4/5] bg-muted">
    <LazyImage /> or <Placeholder />
    {/* Primary Metric Badge (top-right) */}
    {/* Spend Overlay (bottom gradient) */}
  </div>

  {/* Content */}
  <div className="p-3 space-y-2">
    {/* Title or ad_name */}
    {/* Body text (if not catalog) */}
    {/* Campaign info */}
    {/* Secondary Metrics */}
  </div>
</Card>
```

## Next Steps
1. User wants to refine TopCreativeCard appearance
2. After refinement: rollout to other dashboards
3. Pending phases: Views SQL (3), Dashboard page (4), Insights (5)

## Roadmap Reference
See: `docs/ROADMAP-DASHBOARDS.md`
