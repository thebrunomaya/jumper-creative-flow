import React, { useState } from 'react';
import { LazyImage } from '@/components/ui/lazy-image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatPercentage, formatNumber } from '@/utils/metricPerformance';
import { ImageOff, TrendingUp, TrendingDown, Minus, DollarSign, Eye, ShoppingCart, MousePointer } from 'lucide-react';
import type { AdMetrics } from '@/pages/CreativesPrototypePage';

interface CreativesGridViewProps {
  ads: AdMetrics[];
}

// Placeholder para quando não há imagem
const PlaceholderImage = () => (
  <div className="w-full aspect-square bg-muted flex items-center justify-center">
    <ImageOff className="h-12 w-12 text-muted-foreground" />
  </div>
);

// Badge de performance ROAS
const ROASBadge = ({ roas }: { roas: number }) => {
  if (roas >= 3) {
    return (
      <Badge className="bg-green-500 hover:bg-green-600 text-white">
        <TrendingUp className="h-3 w-3 mr-1" />
        {roas.toFixed(1)}x ROAS
      </Badge>
    );
  } else if (roas >= 1) {
    return (
      <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
        <Minus className="h-3 w-3 mr-1" />
        {roas.toFixed(1)}x ROAS
      </Badge>
    );
  } else {
    return (
      <Badge className="bg-red-500 hover:bg-red-600 text-white">
        <TrendingDown className="h-3 w-3 mr-1" />
        {roas.toFixed(1)}x ROAS
      </Badge>
    );
  }
};

export function CreativesGridView({ ads }: CreativesGridViewProps) {
  const [selectedAd, setSelectedAd] = useState<string | null>(null);

  if (ads.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum anúncio encontrado
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {ads.map((ad) => (
        <Card
          key={ad.ad_id}
          className={`overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] ${
            selectedAd === ad.ad_id ? 'ring-2 ring-jumper-orange' : ''
          }`}
          onClick={() => setSelectedAd(selectedAd === ad.ad_id ? null : ad.ad_id)}
        >
          {/* Imagem do criativo */}
          <div className="relative">
            {ad.image_url ? (
              <LazyImage
                src={ad.image_url}
                alt={ad.ad_name}
                className="w-full aspect-square object-cover"
                fallback="/placeholder.svg"
              />
            ) : (
              <PlaceholderImage />
            )}

            {/* Badge de ROAS no canto */}
            <div className="absolute top-2 right-2">
              <ROASBadge roas={ad.roas} />
            </div>

            {/* Overlay com gasto */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
              <p className="text-white font-bold text-lg">
                {formatCurrency(ad.spend)}
              </p>
            </div>
          </div>

          <CardContent className="p-4 space-y-3">
            {/* Nome do anúncio */}
            <div>
              <p className="font-medium text-sm truncate" title={ad.ad_name}>
                {ad.ad_name}
              </p>
              <p className="text-xs text-muted-foreground truncate" title={ad.campaign}>
                {ad.campaign}
              </p>
            </div>

            {/* Métricas principais */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Eye className="h-3 w-3" />
                <span>{formatNumber(ad.impressions)}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <MousePointer className="h-3 w-3" />
                <span>{formatNumber(ad.link_clicks)}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <ShoppingCart className="h-3 w-3" />
                <span>{formatNumber(ad.purchases)}</span>
              </div>
              <div className="flex items-center gap-1 text-green-600 font-medium">
                <DollarSign className="h-3 w-3" />
                <span>{formatCurrency(ad.revenue)}</span>
              </div>
            </div>

            {/* Métricas expandidas (quando selecionado) */}
            {selectedAd === ad.ad_id && (
              <div className="pt-3 border-t space-y-2 text-sm animate-in slide-in-from-top-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CTR:</span>
                  <span className={ad.ctr >= 2 ? 'text-green-600 font-medium' : ''}>
                    {formatPercentage(ad.ctr)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CPC:</span>
                  <span>{formatCurrency(ad.cpc)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Conjunto:</span>
                  <span className="truncate max-w-[150px]" title={ad.adset_name}>
                    {ad.adset_name}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
