
import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface BaseMediaUploadCardProps {
  title: string;
  dimensions: string;
  children: React.ReactNode;
  onRemove?: () => void;
  canRemove?: boolean;
  headerActions?: React.ReactNode;
}

const BaseMediaUploadCard: React.FC<BaseMediaUploadCardProps> = ({
  title,
  dimensions,
  children,
  onRemove,
  canRemove = false,
  headerActions
}) => {
  return (
    <div className="space-y-4 p-6 bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-jumper-text">
          {title}
        </h4>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">{dimensions}</span>
          {headerActions}
          {canRemove && onRemove && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRemove}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm min-h-[160px]">
        <div className="flex min-h-[160px]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default BaseMediaUploadCard;
