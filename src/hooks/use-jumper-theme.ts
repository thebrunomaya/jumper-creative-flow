import { useTheme } from '@/contexts/ThemeContext'

export const useJumperTheme = () => {
  const { theme, toggleTheme } = useTheme()
  
  const isDark = theme === 'dark'
  const isLight = theme === 'light'
  
  // Classes CSS baseadas nas cores oficiais da Jumper Studio
  const getThemeClasses = () => {
    return {
      // Backgrounds oficiais
      background: isDark 
        ? 'bg-jumper-black' 
        : 'bg-jumper-white',
      
      // Backgrounds secundários  
      cardBackground: isDark 
        ? 'bg-jumper-gray-dark' 
        : 'bg-[#F8F9FA]',
      
      // Textos oficiais
      text: isDark 
        ? 'text-jumper-white' 
        : 'text-[#212529]',
      
      // Textos secundários
      textSecondary: isDark 
        ? 'text-jumper-gray-light' 
        : 'text-[#6C757D]',
      
      // Bordas oficiais  
      border: isDark 
        ? 'border-jumper-gray-medium' 
        : 'border-[#E9ECEF]',
      
      // Cores de destaque (sempre laranja)
      accent: 'text-jumper-orange',
      accentBg: 'bg-jumper-orange',
      
      // Estados hover
      hover: isDark 
        ? 'hover:bg-jumper-gray-medium' 
        : 'hover:bg-[#E9ECEF]',
    }
  }
  
  const applyTheme = () => {
    const classes = getThemeClasses()
    
    // Aplica classes no documento
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    
    return classes
  }
  
  return {
    theme,
    isDark,
    isLight,
    toggleTheme,
    getThemeClasses,
    applyTheme,
    
    // Cores oficiais como valores diretos
    colors: {
      orange: '#FA4721',
      purple: '#8143A7',
      white: '#FFFFFF',
      black: '#000000',
      gray: {
        dark: '#181818',
        medium: '#3E3D40',
        light: '#C6CBD4'
      }
    }
  }
}