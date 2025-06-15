
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, FileText, Clock, Mail } from 'lucide-react';

interface SuccessProps {
  creativeId: string;
  onNewCreative: () => void;
}

const Success: React.FC<SuccessProps> = ({ creativeId, onNewCreative }) => {
  useEffect(() => {
    // Trigger confetti animation
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ['#667eea', '#764ba2', '#48bb78'];
    
    (function frame() {
      // Launch confetti from random positions
      if (Date.now() < end) {
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        // Simple confetti effect would be implemented here
        requestAnimationFrame(frame);
      }
    }());
  }, []);

  return (
    <div className="text-center py-12 animate-fade-in">
      {/* Success Icon */}
      <div className="relative mb-8">
        <div className="w-24 h-24 bg-gradient-success rounded-full flex items-center justify-center mx-auto animate-scale-in">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>
        <div className="absolute inset-0 w-24 h-24 bg-green-400 rounded-full mx-auto animate-ping opacity-25"></div>
      </div>

      {/* Success Message */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-jumper-text mb-2">
          🎉 Cri

ativo Enviado com Sucesso!
        </h1>
        <p className="text-gray-600 text-lg">
          Seu criativo foi recebido e está sendo processado pela nossa equipe
        </p>
      </div>

      {/* Creative ID */}
      <Card className="mb-8 border-2 border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">ID do Criativo</p>
            <p className="text-2xl font-bold text-jumper-text font-mono bg-white px-4 py-2 rounded border-2 border-green-300">
              {creativeId}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 text-center">
            <Mail className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-blue-800">Confirmação Enviada</p>
            <p className="text-xs text-blue-600 mt-1">Verifique seu email</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-purple-800">SLA: 24 horas</p>
            <p className="text-xs text-purple-600 mt-1">Para processamento</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 text-center">
            <FileText className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-green-800">Acompanhe no Notion</p>
            <p className="text-xs text-green-600 mt-1">Status em tempo real</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          onClick={onNewCreative}
          className="bg-gradient-jumper hover:opacity-90 transition-opacity px-8 py-3"
        >
          🚀 Enviar Outro Criativo
        </Button>
        
        <Button
          variant="outline"
          onClick={() => window.open('https://notion.so', '_blank')}
          className="border-jumper-blue text-jumper-blue hover:bg-blue-50 px-8 py-3"
        >
          📋 Ir para o Notion
        </Button>
      </div>

      {/* Additional Info */}
      <div className="mt-8 text-sm text-gray-600">
        <p>🔔 Você receberá notificações sobre o progresso do seu criativo</p>
        <p className="mt-1">📞 Em caso de dúvidas, entre em contato com nossa equipe</p>
      </div>
    </div>
  );
};

export default Success;
