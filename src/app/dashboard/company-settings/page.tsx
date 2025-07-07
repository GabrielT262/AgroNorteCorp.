

'use client';

import * as React from 'react';
import Image from 'next/image';
import { useCompanySettings } from '@/context/company-settings-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Phone, Leaf, Loader2 } from 'lucide-react';
import { updateCompanySettingsAction } from '@/app/actions/settings-actions';

const MAX_IMAGE_SIZE_BYTES = 1 * 1024 * 1024; // 1MB

export default function CompanySettingsPage() {
  const { settings, isSettingsLoading } = useCompanySettings();
  const [isSaving, startSavingTransition] = React.useTransition();
  const [logoError, setLogoError] = React.useState<string | null>(null);
  const [bgError, setBgError] = React.useState<string | null>(null);
  const { toast } = useToast();
  const formRef = React.useRef<HTMLFormElement>(null);

  const validateFile = (file: File | null, type: 'logo' | 'bg'): boolean => {
    const errorSetter = type === 'logo' ? setLogoError : setBgError;
    errorSetter(null);
    if (!file || file.size === 0) return true;

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      errorSetter(`La imagen no debe superar 1 MB.`);
      return false;
    }
    return true;
  };

  const handleSaveChanges = () => {
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      const logoFile = formData.get('logo') as File;
      const bgFile = formData.get('login_bg') as File;

      const isLogoValid = validateFile(logoFile, 'logo');
      const isBgValid = validateFile(bgFile, 'bg');

      if (!isLogoValid || !isBgValid) {
        toast({ title: 'Error de Validación', description: 'Por favor, corrige los errores en los archivos.', variant: 'destructive' });
        return;
      }
      
      startSavingTransition(async () => {
        const result = await updateCompanySettingsAction(formData);
        if (result.success) {
          toast({ title: 'Configuración Guardada', description: 'Los cambios se han guardado correctamente.' });
        } else {
          toast({ title: 'Error', description: result.message || 'No se pudo guardar la configuración.', variant: 'destructive' });
        }
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">Personalización de la Empresa</h1>
      
      <form ref={formRef}>
        <Card>
          <CardHeader>
            <CardTitle>Identidad Visual</CardTitle>
            <CardDescription>Personaliza el logo y la pantalla de inicio de sesión.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Logo de la Empresa</Label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 bg-muted rounded-md flex items-center justify-center p-2 relative overflow-hidden">
                  {settings.logo_url ? (
                    <Image src={settings.logo_url} alt="Logo actual" fill className="object-contain" />
                  ) : (
                    <Leaf className="h-12 w-12 text-primary" />
                  )}
                </div>
                <div className="flex-grow">
                  <Input name="logo" type="file" accept="image/*" />
                  {logoError && <p className="text-sm font-medium text-destructive mt-2">{logoError}</p>}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fondo de Inicio de Sesión</Label>
              <div className="flex items-center gap-4">
                <div className="w-48 h-24 bg-muted rounded-md flex items-center justify-center p-2 relative overflow-hidden">
                   {settings.login_bg_url ? (
                    <Image src={settings.login_bg_url} alt="Fondo actual" fill className="object-cover" />
                  ) : (
                    <span className="text-muted-foreground text-sm text-center">Vista Previa del Fondo</span>
                  )}
                </div>
                <div className="flex-grow">
                  <Input name="login_bg" type="file" accept="image/*" />
                  {bgError && <p className="text-sm font-medium text-destructive mt-2">{bgError}</p>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Contacto de Soporte</CardTitle>
            <CardDescription>Configura el contacto de soporte para la empresa.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 font-semibold"><Phone className="h-5 w-5" /> WhatsApp de Soporte</Label>
              <p className="text-sm text-muted-foreground">Este número se mostrará en la ventana de ayuda. Incluye el código de país (ej: 51987654321).</p>
              <Input 
                name="support_whats_app"
                type="tel" 
                placeholder="Número de WhatsApp para soporte" 
                defaultValue={settings.support_whats_app || ''}
              />
            </div>
          </CardContent>
        </Card>
      </form>

      <div className="flex justify-end pt-2">
        <Button onClick={handleSaveChanges} disabled={isSaving || isSettingsLoading}>
            {(isSaving || isSettingsLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            Guardar Cambios
        </Button>
      </div>
    </div>
  );
}
