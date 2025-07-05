
'use client';

import * as React from 'react';
import type { CompanySettings } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEY = 'agronorte-company-settings';

const defaultSettings: CompanySettings = {
  logoUrl: '', 
  loginBackgroundUrl: '', 
  supportWhatsApp: '',
};

interface CompanySettingsContextType {
  settings: CompanySettings;
  setSettings: (newSettings: Partial<CompanySettings>) => void;
  isSettingsLoading: boolean;
}

const CompanySettingsContext = React.createContext<CompanySettingsContextType | undefined>(undefined);

export function CompanySettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettingsState] = React.useState<CompanySettings>(defaultSettings);
  const [isSettingsLoading, setLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(STORAGE_KEY);
      if (storedSettings) {
        setSettingsState(JSON.parse(storedSettings));
      }
    } catch (error) {
      console.error("Failed to load company settings from localStorage", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const setSettings = (newSettings: Partial<CompanySettings>) => {
    setSettingsState(prevState => {
      const updatedSettings = { ...prevState, ...newSettings };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings));
        toast({
          title: 'Configuración Guardada',
          description: 'La personalización de la empresa ha sido actualizada.',
        });
      } catch (error) {
        console.error("Failed to save company settings to localStorage", error);
        toast({
          title: 'Error al Guardar',
          description: 'No se pudo guardar la configuración.',
          variant: 'destructive',
        });
      }
      return updatedSettings;
    });
  };

  const value = { settings, setSettings, isSettingsLoading };

  return (
    <CompanySettingsContext.Provider value={value}>
      {children}
    </CompanySettingsContext.Provider>
  );
}

export const useCompanySettings = () => {
  const context = React.useContext(CompanySettingsContext);
  if (context === undefined) {
    throw new Error('useCompanySettings must be used within a CompanySettingsProvider');
  }
  return context;
};
