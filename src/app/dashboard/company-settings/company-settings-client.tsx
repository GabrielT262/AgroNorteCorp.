
'use client';

import * as React from 'react';
import Image from 'next/image';
import { useCompanySettings } from '@/context/company-settings-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Phone, Leaf, Loader2, Image as ImageIcon } from 'lucide-react';
import { updateCompanySettingsAction } from '@/app/actions/settings-actions';

const MAX_IMAGE_SIZE_BYTES = 1 * 1024 * 1024; // 1MB

export default function CompanySettingsClient() {
  const { settings, isSettingsLoading } = useCompanySettings();
  const [isSaving, startSavingTransition] = React.useTransition();
  const [logoError, setLogoError] = React.useState<string | null>(null);
  const [bgError, setBgError] = React.useState<string | null>(null);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [bgPreview, setBgPreview] = React.useState<string | null>(null);
  const { toast } = useToast();
  const formRef = React.useRef<HTMLFormElement>(null);
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const bgInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'bg') => {
    const file = e.target.files?.[0] || null;
    const errorSetter = type === 'logo' ? setLogoError : setBgError;
    const previewSetter = type === 'logo' ? setLogoPreview : setBgPreview;
    
    errorSetter(null);
    if (!file) {
      previewSetter(null);
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      errorSetter(`La imagen no debe superar 1 MB.`);
      previewSetter(null);
      if(e.target) e.target.value = ''; // Clear file input
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      previewSetter(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveChanges = () => {
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      startSavingTransition(async () => {
        const result = await updateCompanySettingsAction(formData);
        if (result.success) {
          toast({ title: 'Configuración Guardada', description: 'Los cambios se han guardado correctamente.' });
          setLogoPreview(null);
          setBgPreview(null);
          if (logoInputRef.current) logoInputRef.current.value = '';
          if (bgInputRef.current) bgInputRef.current.value = '';
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
          <CardContent className="space-y-8">
            <div className="space-y-2">
              <Label>Logo de la Empresa</Label>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-muted rounded-md flex items-center justify-center p-2 relative overflow-hidden ring-2 ring-offset-2 ring-primary/50">
                  <Image src={logoPreview || settings.logo_url || 'https://placehold.co/100x100.png'} alt="Vista previa del logo" fill className="object-contain" />
                </div>
                <div className="flex-grow space-y-2">
                  <Button type="button" variant="outline" onClick={() => logoInputRef.current?.click()}>
                    <ImageIcon className="mr-2"/> Cambiar Logo
                  </Button>
                  <Input ref={logoInputRef} name="logo" type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, 'logo')} />
                  <p className="text-xs text-muted-foreground">Sube un archivo de imagen (JPG, PNG). Máx 1MB.</p>
                  {logoError && <p className="text-sm font-medium text-destructive mt-2">{logoError}</p>}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fondo de Inicio de Sesión</Label>
              <div className="flex items-center gap-6">
                <div className="w-48 h-24 bg-muted rounded-md flex items-center justify-center relative overflow-hidden ring-2 ring-offset-2 ring-primary/50">
                   <Image src={bgPreview || settings.login_bg_url || 'https://placehold.co/400x200.png'} alt="Vista previa del fondo" fill className="object-cover" />
                </div>
                <div className="flex-grow space-y-2">
                  <Button type="button" variant="outline" onClick={() => bgInputRef.current?.click()}>
                    <ImageIcon className="mr-2"/> Cambiar Fondo
                  </Button>
                  <Input ref={bgInputRef} name="login_bg" type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, 'bg')} />
                  <p className="text-xs text-muted-foreground">Sube un archivo de imagen (JPG, PNG). Máx 1MB.</p>
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
