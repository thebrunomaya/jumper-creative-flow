import React from 'react'
import { JumperButton } from '@/components/ui/jumper-button'
import { useJumperTheme } from '@/hooks/use-jumper-theme'
import { cn } from '@/lib/utils'
import { Sun, Moon } from 'lucide-react'

interface ThemeToggleProps {
  className?: string
  variant?: 'icon' | 'text' | 'full'
  size?: 'sm' | 'default' | 'lg'
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className, 
  variant = 'icon',
  size = 'default' 
}) => {
  const { theme, isDark, toggleTheme } = useJumperTheme()

  const getButtonContent = () => {
    switch (variant) {
      case 'text':
        return isDark ? 'Modo Claro' : 'Modo Escuro'
      
      case 'full':
        return (
          <span className="flex items-center gap-2">
            {isDark ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
            <span>
              {isDark ? 'Modo Claro' : 'Modo Escuro'}
            </span>
          </span>
        )
      
      case 'icon':
      default:
        return isDark ? (
          <Sun className="w-4 h-4" aria-label="Sol" />
        ) : (
          <Moon className="w-4 h-4" aria-label="Lua" />
        )
    }
  }

  const getButtonSize = () => {
    if (variant === 'icon') {
      return 'icon'
    }
    return size
  }

  return (
    <JumperButton
      variant="ghost"
      size={getButtonSize()}
      onClick={toggleTheme}
      className={cn(
        "transition-all duration-300 ease-in-out",
        "hover:scale-105 active:scale-95",
        // Cores específicas para o toggle
        "border-border hover:border-jumper-orange/50",
        "hover:bg-jumper-orange/10",
        className
      )}
      aria-label={`Alternar para ${isDark ? 'modo claro' : 'modo escuro'}`}
      title={`Alternar para ${isDark ? 'modo claro' : 'modo escuro'}`}
    >
      {getButtonContent()}
    </JumperButton>
  )
}

export { ThemeToggle }