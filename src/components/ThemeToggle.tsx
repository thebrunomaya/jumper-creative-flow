import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const [isDark, setIsDark] = useState(true); // Dark mode como padrão

  // Detectar preferência do sistema e localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('jumper-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      setIsDark(savedTheme === 'dark');
    } else {
      setIsDark(prefersDark);
    }
  }, []);

  // Aplicar tema no DOM
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove('light');
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    
    // Salvar preferência
    localStorage.setItem('jumper-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <button
      onClick={toggleTheme}
      className={`theme-toggle ${className}`}
      aria-label={`Alternar para modo ${isDark ? 'claro' : 'escuro'}`}
      title={`Alternar para modo ${isDark ? 'claro' : 'escuro'}`}
    >
      <div className="toggle-thumb">
        {isDark ? (
          <Moon className="w-3 h-3 text-muted-foreground" />
        ) : (
          <Sun className="w-3 h-3 text-primary" />
        )}
      </div>
    </button>
  );
};

// Hook personalizado para usar o tema
export const useTheme = () => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    const currentTheme = root.classList.contains('light') ? 'light' : 'dark';
    setIsDark(currentTheme === 'dark');

    // Observer para mudanças no tema
    const observer = new MutationObserver(() => {
      const newTheme = root.classList.contains('light') ? 'light' : 'dark';
      setIsDark(newTheme === 'dark');
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  return { isDark, theme: isDark ? 'dark' : 'light' };
};

export default ThemeToggle;