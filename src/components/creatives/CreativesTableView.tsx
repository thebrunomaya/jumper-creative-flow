import React from 'react';
import { LazyImage } from '@/components/ui/lazy-image';
import { formatCurrency, formatPercentage, formatNumber } from '@/utils/metricPerformance';
import { ImageOff, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { AdMetrics } from '@/pages/CreativesPrototypePage';

interface CreativesTableViewProps {
  ads: AdMetrics[];
}

// Placeholder para quando não há imagem
const PlaceholderImage = () => (
  <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
    <ImageOff className="h-6 w-6 text-muted-foreground" />
  </div>
);

// Indicador de performance ROAS
const ROASIndicator = ({ roas }: { roas: number }) => {
  if (roas >= 3) {
    return <TrendingUp className="h-4 w-4 text-green-500" />;
  } else if (roas >= 1) {
    return <Minus className="h-4 w-4 text-yellow-500" />;
  } else {
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  }
};

export function CreativesTableView({ ads }: CreativesTableViewProps) {
  if (ads.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum anúncio encontrado
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-3 font-medium">Preview</th>
            <th className="text-left p-3 font-medium">Anúncio</th>
            <th className="text-left p-3 font-medium">Campanha</th>
            <th className="text-right p-3 font-medium">Gasto</th>
            <th className="text-right p-3 font-medium">Impressões</th>
            <th className="text-right p-3 font-medium">Cliques</th>
            <th className="text-right p-3 font-medium">CTR</th>
            <th className="text-right p-3 font-medium">CPC</th>
            <th className="text-right p-3 font-medium">Compras</th>
            <th className="text-right p-3 font-medium">Receita</th>
            <th className="text-right p-3 font-medium">ROAS</th>
          </tr>
        </thead>
        <tbody>
          {ads.map((ad, index) => (
            <tr
              key={ad.ad_id}
              className={`border-b hover:bg-muted/30 transition-colors ${
                index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
              }`}
            >
              {/* Preview */}
              <td className="p-3">
                {ad.image_url ? (
                  <LazyImage
                    src={ad.image_url}
                    alt={ad.ad_name}
                    className="w-16 h-16 object-cover rounded"
                    fallback="/placeholder.svg"
                  />
                ) : (
                  <PlaceholderImage />
                )}
              </td>

              {/* Nome do anúncio */}
              <td className="p-3">
                <div className="max-w-[200px]">
                  <p className="font-medium truncate" title={ad.ad_name}>
                    {ad.ad_name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate" title={ad.adset_name}>
                    {ad.adset_name}
                  </p>
                </div>
              </td>

              {/* Campanha */}
              <td className="p-3">
                <div className="max-w-[150px]">
                  <p className="text-sm truncate" title={ad.campaign}>
                    {ad.campaign}
                  </p>
                </div>
              </td>

              {/* Métricas */}
              <td className="p-3 text-right font-medium">
                {formatCurrency(ad.spend)}
              </td>
              <td className="p-3 text-right text-muted-foreground">
                {formatNumber(ad.impressions)}
              </td>
              <td className="p-3 text-right text-muted-foreground">
                {formatNumber(ad.link_clicks)}
              </td>
              <td className="p-3 text-right">
                <span className={ad.ctr >= 2 ? 'text-green-600' : ad.ctr >= 1 ? 'text-yellow-600' : 'text-muted-foreground'}>
                  {formatPercentage(ad.ctr)}
                </span>
              </td>
              <td className="p-3 text-right text-muted-foreground">
                {formatCurrency(ad.cpc)}
              </td>
              <td className="p-3 text-right font-medium">
                {formatNumber(ad.purchases)}
              </td>
              <td className="p-3 text-right font-medium text-green-600">
                {formatCurrency(ad.revenue)}
              </td>
              <td className="p-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <ROASIndicator roas={ad.roas} />
                  <span className={`font-bold ${
                    ad.roas >= 3 ? 'text-green-600' :
                    ad.roas >= 1 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {ad.roas.toFixed(1)}x
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>

        {/* Footer com totais */}
        <tfoot>
          <tr className="border-t-2 bg-muted/50 font-bold">
            <td className="p-3" colSpan={3}>
              Total ({ads.length} anúncios)
            </td>
            <td className="p-3 text-right">
              {formatCurrency(ads.reduce((sum, ad) => sum + ad.spend, 0))}
            </td>
            <td className="p-3 text-right text-muted-foreground">
              {formatNumber(ads.reduce((sum, ad) => sum + ad.impressions, 0))}
            </td>
            <td className="p-3 text-right text-muted-foreground">
              {formatNumber(ads.reduce((sum, ad) => sum + ad.link_clicks, 0))}
            </td>
            <td className="p-3 text-right">-</td>
            <td className="p-3 text-right">-</td>
            <td className="p-3 text-right">
              {formatNumber(ads.reduce((sum, ad) => sum + ad.purchases, 0))}
            </td>
            <td className="p-3 text-right text-green-600">
              {formatCurrency(ads.reduce((sum, ad) => sum + ad.revenue, 0))}
            </td>
            <td className="p-3 text-right">
              {(() => {
                const totalSpend = ads.reduce((sum, ad) => sum + ad.spend, 0);
                const totalRevenue = ads.reduce((sum, ad) => sum + ad.revenue, 0);
                const totalRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
                return (
                  <span className={`font-bold ${
                    totalRoas >= 3 ? 'text-green-600' :
                    totalRoas >= 1 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {totalRoas.toFixed(1)}x
                  </span>
                );
              })()}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
