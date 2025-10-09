import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import PasswordModal from '@/components/PasswordModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, PlusCircle, Shield, LayoutDashboard, Lock, BarChart3, TrendingUp } from 'lucide-react';
import { AccountSelectorModal } from '@/components/reports/AccountSelectorModal';

const UserMenu: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const userId = currentUser?.id || authData?.user?.id || null;
      if (!userId) return setIsAdmin(false);
      const { data, error } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
      setIsAdmin(!error && !!data);
    };
    checkRole();
  }, [currentUser?.id]);

  if (!currentUser) return null;

  console.log('🔍 UserMenu - currentUser:', currentUser);

  const formatUserName = (name: string) => {
    console.log('🔍 UserMenu - formatUserName input:', name);
    return name.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleLogout = () => {
    logout();
    toast({ title: 'Logout realizado', description: 'Você foi desconectado do sistema' });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="font-medium">{formatUserName(currentUser.name)}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {isAdmin && (
            <DropdownMenuItem onSelect={() => navigate('/admin')} className="cursor-pointer">
              <Shield className="mr-2 h-4 w-4" />
              <span>Painel de Admin</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => setShowReportsModal(true)} className="cursor-pointer">
            <BarChart3 className="mr-2 h-4 w-4" />
            <span>Relatórios</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => navigate('/optimization')} className="cursor-pointer">
            <TrendingUp className="mr-2 h-4 w-4" />
            <span>Otimizações</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => navigate('/manager')} className="cursor-pointer">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Meus Criativos</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => navigate('/create')} className="cursor-pointer">
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Novo Criativo</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setShowPasswordModal(true)} className="cursor-pointer">
            <Lock className="mr-2 h-4 w-4" />
            <span>Criar/Redefinir Senha</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleLogout} className="cursor-pointer text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PasswordModal 
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
      
      <AccountSelectorModal
        isOpen={showReportsModal}
        onClose={() => setShowReportsModal(false)}
      />
    </>
  );
};

export default UserMenu;
