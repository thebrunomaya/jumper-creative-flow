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
import { User, LogOut, Shield, Lock, Building2, Users } from 'lucide-react';

const UserMenu: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const userId = currentUser?.id || authData?.user?.id || null;
      if (!userId) {
        setIsAdmin(false);
        setIsStaff(false);
        return;
      }

      // Check admin role
      const { data: adminData, error: adminError } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
      setIsAdmin(!adminError && !!adminData);

      // Check staff role
      const { data: staffData, error: staffError } = await supabase.rpc('has_role', { _user_id: userId, _role: 'staff' });
      setIsStaff(!staffError && !!staffData);
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
          {(isAdmin || isStaff) && (
            <>
              <DropdownMenuItem onSelect={() => navigate('/admin/accounts')} className="cursor-pointer">
                <Building2 className="mr-2 h-4 w-4" />
                <span>Gestão de Contas</span>
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuItem onSelect={() => navigate('/admin/managers')} className="cursor-pointer">
                    <Users className="mr-2 h-4 w-4" />
                    <span>Gestão de Gerentes</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => navigate('/admin')} className="cursor-pointer">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Painel de Admin</span>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
            </>
          )}
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
    </>
  );
};

export default UserMenu;
