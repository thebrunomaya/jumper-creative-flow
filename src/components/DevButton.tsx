
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import DevPanel from './DevPanel';

const DevButton: React.FC = () => {
  const [isDevPanelOpen, setIsDevPanelOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-4 left-4 z-40">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsDevPanelOpen(true)}
          className="text-xs text-gray-400 hover:text-gray-600 opacity-50 hover:opacity-100 transition-opacity"
        >
          dev
        </Button>
      </div>
      
      <DevPanel 
        isOpen={isDevPanelOpen} 
        onClose={() => setIsDevPanelOpen(false)} 
      />
    </>
  );
};

export default DevButton;
