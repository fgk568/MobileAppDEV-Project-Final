import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMultiDatabase } from './MultiDatabaseContext';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(null);
  const { getCurrentFirmConfig, currentFirmId } = useMultiDatabase();

  useEffect(() => {
    if (currentFirmId) {
      const firmConfig = getCurrentFirmConfig();
      const newTheme = createTheme(firmConfig);
      setTheme(newTheme);
    }
  }, [currentFirmId, getCurrentFirmConfig]);

  const createTheme = (firmConfig) => {
    return {
      colors: {
        primary: firmConfig.primaryColor,
        secondary: firmConfig.secondaryColor,
        accent: firmConfig.accentColor,
        background: '#f5f5f5',
        surface: '#ffffff',
        text: '#333333',
        textSecondary: '#666666',
        textLight: '#999999',
        border: '#e0e0e0',
        success: '#4caf50',
        warning: '#ff9800',
        error: '#f44336',
        info: '#2196f3',
      },
      gradients: {
        primary: [firmConfig.primaryColor, firmConfig.secondaryColor],
        accent: [firmConfig.secondaryColor, firmConfig.accentColor],
      },
      shadows: {
        small: {
          shadowColor: firmConfig.primaryColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        },
        medium: {
          shadowColor: firmConfig.primaryColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 4,
        },
        large: {
          shadowColor: firmConfig.primaryColor,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 16,
          elevation: 8,
        },
      },
      typography: {
        h1: {
          fontSize: 32,
          fontWeight: 'bold',
          color: '#333333',
        },
        h2: {
          fontSize: 24,
          fontWeight: 'bold',
          color: '#333333',
        },
        h3: {
          fontSize: 20,
          fontWeight: 'bold',
          color: '#333333',
        },
        h4: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#333333',
        },
        body: {
          fontSize: 16,
          color: '#333333',
        },
        caption: {
          fontSize: 14,
          color: '#666666',
        },
        small: {
          fontSize: 12,
          color: '#999999',
        },
      },
      spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
      },
      borderRadius: {
        small: 4,
        medium: 8,
        large: 12,
        xl: 16,
        round: 50,
      },
      firm: {
        id: firmConfig.id,
        name: firmConfig.name,
        shortName: firmConfig.shortName,
        logo: firmConfig.logo,
        features: firmConfig.features,
      },
    };
  };

  const value = {
    theme,
    isReady: !!theme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
