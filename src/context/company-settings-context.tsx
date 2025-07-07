
'use client';

import * as React from 'react';
import type { CompanySettings } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { updateCompanySettingsAction } from '@/app/actions/settings-actions';

interface CompanySettingsContextType {
  settings: CompanySettings;
  setSettings: (formData: FormData) => Promise<void>;
  isSettingsLoading: boolean;
}

const CompanySettingsContext = React.createContext<CompanySettingsContextType | undefined>(undefined);

export function CompanySettingsProvider({ children, initialSettings }: { children: React.ReactNode, initialSettings: CompanySettings }) {
  const [settings, setSettingsState] = React.useState<CompanySettings>(initialSettings);
  const [isSettingsLoading, setLoading] = React.useState(false);
  const { toast } = useToast();

  const setSettings = async (formData: FormData) => {
    setLoading(true);
    const result = await updateCompanySettingsAction(formData);
    setLoading(false);

    if (result.success) {
      setSettingsState(prev => ({
        ...prev,
        support_whats_app: formData.get('support_whats_app') as string,
      }));
      toast({
        title: 'Configuración Guardada',
        description: 'La personalización de la empresa ha sido actualizada.',
      });
    } else {
      toast({
        title: 'Error al Guardar',
        description: result.message || 'No se pudo guardar la configuración.',
        variant: 'destructive',
      });
    }
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
