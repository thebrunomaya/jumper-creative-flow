
import React from 'react';
import { FormData } from '@/types/creative';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useNotionClients, useNotionPartners } from '@/hooks/useNotionData';
import { Skeleton } from '@/components/ui/skeleton';

interface Step1Props {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  errors: Record<string, string>;
}

const Step1: React.FC<Step1Props> = ({ formData, updateFormData, errors }) => {
  const { clients, loading: clientsLoading, error: clientsError } = useNotionClients();
  const { partners, loading: partnersLoading, error: partnersError } = useNotionPartners();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-jumper-text mb-2">📋 Informações Básicas</h2>
        <p className="text-gray-600">Vamos começar com os dados essenciais do seu criativo</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Cliente */}
        <div className="space-y-2">
          <Label htmlFor="client" className="text-sm font-medium text-jumper-text">
            Cliente *
          </Label>
          {clientsLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : (
            <Select value={formData.client} onValueChange={(value) => updateFormData({ client: value })}>
              <SelectTrigger className={`h-12 ${errors.client ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {errors.client && <p className="text-sm text-red-500">{errors.client}</p>}
          {clientsError && <p className="text-sm text-yellow-600">⚠️ {clientsError} (usando dados locais)</p>}
        </div>

        {/* Parceiro */}
        <div className="space-y-2">
          <Label htmlFor="partner" className="text-sm font-medium text-jumper-text">
            Enviado por *
          </Label>
          {partnersLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : (
            <Select value={formData.partner} onValueChange={(value) => updateFormData({ partner: value })}>
              <SelectTrigger className={`h-12 ${errors.partner ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Selecione o parceiro" />
              </SelectTrigger>
              <SelectContent>
                {partners.map((partner) => (
                  <SelectItem key={partner.id} value={partner.id}>
                    {partner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {errors.partner && <p className="text-sm text-red-500">{errors.partner}</p>}
          {partnersError && <p className="text-sm text-yellow-600">⚠️ {partnersError} (usando dados locais)</p>}
        </div>
      </div>

      {/* Plataforma */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-jumper-text">Plataforma *</Label>
        <div className="grid grid-cols-2 gap-4">
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              formData.platform === 'meta' 
                ? 'ring-2 ring-jumper-blue bg-blue-50' 
                : 'hover:shadow-md'
            }`}
            onClick={() => updateFormData({ platform: 'meta', creativeType: undefined, objective: undefined })}
          >
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-3">📘</div>
              <h3 className="font-semibold text-jumper-text">Meta Ads</h3>
              <p className="text-sm text-gray-600 mt-1">Facebook & Instagram</p>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              formData.platform === 'google' 
                ? 'ring-2 ring-jumper-blue bg-blue-50' 
                : 'hover:shadow-md'
            }`}
            onClick={() => updateFormData({ platform: 'google', creativeType: undefined, objective: undefined })}
          >
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="font-semibold text-jumper-text">Google Ads</h3>
              <p className="text-sm text-gray-600 mt-1">Search & Display</p>
            </CardContent>
          </Card>
        </div>
        {errors.platform && <p className="text-sm text-red-500">{errors.platform}</p>}
      </div>

      {/* Meta Ads specific fields */}
      {formData.platform === 'meta' && (
        <div className="grid gap-6 md:grid-cols-2 animate-fade-in">
          {/* Tipo de Criativo */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-jumper-text">Tipo de Criativo *</Label>
            <Select value={formData.creativeType || ''} onValueChange={(value) => updateFormData({ creativeType: value as any })}>
              <SelectTrigger className={`h-12 ${errors.creativeType ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image">🖼️ Imagem única</SelectItem>
                <SelectItem value="carousel">🎠 Carrossel</SelectItem>
                <SelectItem value="video">🎬 Vídeo</SelectItem>
              </SelectContent>
            </Select>
            {errors.creativeType && <p className="text-sm text-red-500">{errors.creativeType}</p>}
          </div>

          {/* Objetivo */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-jumper-text">Objetivo *</Label>
            <Select value={formData.objective || ''} onValueChange={(value) => updateFormData({ objective: value as any })}>
              <SelectTrigger className={`h-12 ${errors.objective ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Selecione o objetivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sales">💰 Vendas</SelectItem>
                <SelectItem value="traffic">🚗 Tráfego</SelectItem>
                <SelectItem value="awareness">👁️ Reconhecimento</SelectItem>
                <SelectItem value="leads">📧 Leads</SelectItem>
                <SelectItem value="engagement">❤️ Engajamento</SelectItem>
              </SelectContent>
            </Select>
            {errors.objective && <p className="text-sm text-red-500">{errors.objective}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Step1;
