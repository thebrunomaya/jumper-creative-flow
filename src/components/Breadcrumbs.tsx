
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
  
  // Tipo de Anúncio (só para Meta) - mostra exatamente o que o usuário vê
  if (formData.platform === 'meta' && formData.creativeType) {
    let typeLabel = '';
    
    if (formData.creativeType === 'single') {
      typeLabel = 'Imagem única';
    } else if (formData.creativeType === 'carousel') {
      typeLabel = 'Carrossel';
    } else if (formData.creativeType === 'collection') {
      typeLabel = 'Coleção';
    } else if (formData.creativeType === 'video') {
      typeLabel = 'Vídeo';
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
          <React.Fragment key={index}>
            <BreadcrumbItem>
              {index === breadcrumbItems.length - 1 ? (
                <BreadcrumbPage className="font-semibold text-jumper-blue">
                  {item.label}
                </BreadcrumbPage>
              ) : (
                <span className="text-gray-600">
                  {item.label}
                </span>
              )}
            </BreadcrumbItem>
            {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default Breadcrumbs;
