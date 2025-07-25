
import React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { FormData } from '@/types/creative';

interface BreadcrumbsProps {
  formData: FormData;
  clients: Array<{ id: string; name: string; objectives?: string[] }>;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ formData, clients }) => {
  const selectedClient = clients.find(client => client.id === formData.client);
  
  const breadcrumbItems = [];
  
  // Conta
  if (formData.client && selectedClient) {
    breadcrumbItems.push({
      label: selectedClient.name,
      isActive: true
    });
  }
  
  // Objetivo de Campanha
  if (formData.campaignObjective) {
    breadcrumbItems.push({
      label: formData.campaignObjective,
      isActive: true
    });
  }
  
  // Tipo de Anúncio - mostra o nome correto baseado no tipo
  if (formData.platform === 'meta' && formData.creativeType) {
    let typeLabel = '';
    
    if (formData.creativeType === 'single') {
      typeLabel = 'Imagem/Vídeo Único';
    } else if (formData.creativeType === 'carousel') {
      typeLabel = 'Carrossel';
    } else if (formData.creativeType === 'collection') {
      typeLabel = 'Coleção';
    } else if (formData.creativeType === 'existing-post') {
      typeLabel = 'Publicação Existente';
    } else {
      typeLabel = formData.creativeType;
    }
    
    breadcrumbItems.push({
      label: typeLabel,
      isActive: true
    });
  }

  // Não mostra breadcrumbs se não há itens suficientes
  if (breadcrumbItems.length === 0) {
    return null;
  }

  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => (
          <div key={index} className="contents">
            <BreadcrumbItem>
              {index === breadcrumbItems.length - 1 ? (
                <BreadcrumbPage className="font-semibold text-jumper-blue">
                  {item.label}
                </BreadcrumbPage>
              ) : (
                <span className="text-muted-foreground">
                  {item.label}
                </span>
              )}
            </BreadcrumbItem>
            {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default Breadcrumbs;
