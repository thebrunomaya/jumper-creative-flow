
import React from 'react';
import { JumperButton } from '@/components/ui/jumper-button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const UserMenu: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado do sistema",
    });
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2 text-sm">
        <User className="h-4 w-4" />
        <span className="font-medium">{currentUser.name}</span>
      </div>
      
      <JumperButton
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        className="flex items-center space-x-2"
      >
        <LogOut className="h-4 w-4" />
        <span>Sair</span>
      </JumperButton>
    </div>
  );
};

export default UserMenu;
