
'use client';

import * as React from 'react';
import { useCompanySettings } from '@/context/company-settings-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Image as ImageIcon, Wallpaper, Upload, X, Phone } from 'lucide-react';

export default function CompanySettingsPage() {
  const { settings, setSettings, isSettingsLoading } = useCompanySettings();
  const { toast } = useToast();

  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [backgroundPreview, setBackgroundPreview] = React.useState<string | null>(null);
  const [supportWhatsApp, setSupportWhatsApp] = React.useState<string>('');

  React.useEffect(() => {
    if (!isSettingsLoading) {
      setLogoPreview(settings.logoUrl);
      setBackgroundPreview(settings.loginBackgroundUrl);
      setSupportWhatsApp(settings.supportWhatsApp);
    }
  }, [isSettingsLoading, settings]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setPreview: (url: string | null) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast({
        title: 'Archivo demasiado grande',
        description: 'Por favor, sube una imagen de menos de 2MB.',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveChanges = () => {
    const newSettings: Partial<typeof settings> = {};
    if (logoPreview !== settings.logoUrl) {
      newSettings.logoUrl = logoPreview || '';
    }
    if (backgroundPreview !== settings.loginBackgroundUrl) {
      newSettings.loginBackgroundUrl = backgroundPreview || '';
    }
    if (supportWhatsApp !== settings.supportWhatsApp) {
      newSettings.supportWhatsApp = supportWhatsApp;
    }

    if (Object.keys(newSettings).length > 0) {
      setSettings(newSettings);
    } else {
      toast({
        title: 'Sin cambios',
        description: 'No has realizado ningún cambio para guardar.',
      });
    }
  };

  const handleResetBackground = () => {
    setBackgroundPreview('');
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">Personalización de la Empresa</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Identidad Visual y Contacto</CardTitle>
          <CardDescription>Personaliza el logo, el fondo de sesión y el contacto de soporte.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 font-semibold"><ImageIcon className="h-5 w-5" /> Logo de la Empresa</Label>
              <p className="text-sm text-muted-foreground">Sube el logo de tu empresa (recomendado: formato cuadrado, .png, &lt;2MB).</p>
              <div className="p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-4">
                {logoPreview ? (
                  <img src={logoPreview} alt="Vista previa del logo" className="h-32 w-32 object-contain rounded-md bg-muted p-2" />
                ) : (
                  <div className="h-32 w-32 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                    <span>Vista Previa</span>
                  </div>
                )}
                <Button onClick={() => document.getElementById('logo-upload')?.click()}>
                  <Upload className="h-4 w-4" /> Cambiar Logo
                </Button>
                <Input
                  id="logo-upload"
                  type="file"
                  className="sr-only"
                  accept="image/png, image/jpeg, image/svg+xml"
                  onChange={(e) => handleFileChange(e, setLogoPreview)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 font-semibold"><Wallpaper className="h-5 w-5" /> Fondo de Inicio de Sesión</Label>
              <p className="text-sm text-muted-foreground">Sube una imagen de fondo para la pantalla de login (recomendado: 1920x1080, &lt;2MB).</p>
              <div className="p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-4">
                {backgroundPreview ? (
                  <div className="w-full aspect-video relative">
                    <img src={backgroundPreview} alt="Vista previa del fondo" className="absolute inset-0 w-full h-full object-cover rounded-md" />
                  </div>
                ) : (
                  <div className="w-full aspect-video bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                    <span>Fondo por Defecto</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button onClick={() => document.getElementById('bg-upload')?.click()}>
                    <Upload className="h-4 w-4" /> Cambiar Fondo
                  </Button>
                  <Input
                    id="bg-upload"
                    type="file"
                    className="sr-only"
                    accept="image/png, image/jpeg"
                    onChange={(e) => handleFileChange(e, setBackgroundPreview)}
                  />
                  <Button variant="ghost" onClick={handleResetBackground} disabled={!backgroundPreview}>
                    <X className="mr-2 h-4 w-4"/> Usar por Defecto
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2 pt-8 border-t">
            <Label className="flex items-center gap-2 font-semibold"><Phone className="h-5 w-5" /> WhatsApp de Soporte</Label>
            <p className="text-sm text-muted-foreground">Este número se mostrará en la ventana de ayuda para los usuarios. Incluye el código de país (ej: 51987654321).</p>
            <Input 
              type="tel" 
              placeholder="Número de WhatsApp para soporte" 
              value={supportWhatsApp}
              onChange={(e) => setSupportWhatsApp(e.target.value)}
            />
          </div>
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSaveChanges}>Guardar Cambios</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
