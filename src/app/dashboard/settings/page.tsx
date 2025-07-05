
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from '@/context/theme-context';
import { useToast } from '@/hooks/use-toast';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Lock, Palette, PenSquare } from 'lucide-react';

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'La contraseña actual es requerida.'),
    newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres.'),
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function SettingsPage() {
  const { setTheme, theme } = useTheme();
  const { toast } = useToast();
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>('https://placehold.co/100x100.png');
  const [signaturePreview, setSignaturePreview] = React.useState<string | null>('https://placehold.co/200x80.png?text=Firma');

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onPasswordSubmit = (data: PasswordFormValues) => {
    // In a real app, you would call an API to change the password.
    console.log(data);
    toast({
      title: 'Contraseña Actualizada',
      description: 'Tu contraseña ha sido cambiada exitosamente.',
    });
    passwordForm.reset();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setPreview: React.Dispatch<React.SetStateAction<string | null>>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        // In a real app, you would save this to the user's profile.
        // For this prototype, we just update the preview.
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
      // In a real app, you would upload the files and update the user's profile URL from the backend.
      toast({
          title: "Perfil Actualizado",
          description: "Tus cambios han sido guardados (simulado)."
      });
  }


  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">Configuración</h1>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="profile"><User className="mr-2" /> Perfil</TabsTrigger>
          <TabsTrigger value="security"><Lock className="mr-2" /> Seguridad</TabsTrigger>
          <TabsTrigger value="appearance"><Palette className="mr-2" /> Apariencia</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Perfil Público</CardTitle>
              <CardDescription>Esta información será visible para otros usuarios.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Foto de Perfil</Label>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={avatarPreview || ''} alt="Gabriel T" data-ai-hint="person portrait" />
                        <AvatarFallback>GT</AvatarFallback>
                      </Avatar>
                      <Button asChild variant="outline">
                          <Label htmlFor="avatar-upload">Cambiar Foto
                              <Input id="avatar-upload" type="file" className="sr-only" accept="image/*" onChange={(e) => handleFileChange(e, setAvatarPreview)} />
                          </Label>
                      </Button>
                    </div>
                  </div>
                   <div className="space-y-2">
                    <Label>Firma Digital</Label>
                    <div className="flex items-center gap-4">
                        <div className="w-40 h-20 bg-muted rounded-md flex items-center justify-center p-1">
                            {signaturePreview ? <img src={signaturePreview} alt="Firma digital" className="max-w-full max-h-full object-contain" data-ai-hint="signature"/> : <span className="text-xs text-muted-foreground">Vista Previa</span>}
                        </div>
                      <Button asChild variant="outline">
                          <Label htmlFor="signature-upload">Actualizar
                              <Input id="signature-upload" type="file" className="sr-only" accept="image/png, image/jpeg" onChange={(e) => handleFileChange(e, setSignaturePreview)} />
                          </Label>
                      </Button>
                    </div>
                  </div>
               </div>

              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input defaultValue="Gabriel T" disabled />
              </div>
              <div className="space-y-2">
                <Label>Área</Label>
                <Input defaultValue="Administrador" disabled />
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6 flex justify-end">
                <Button onClick={handleSaveProfile}>Guardar Cambios</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Contraseña</CardTitle>
              <CardDescription>Cambia tu contraseña. Se recomienda usar una contraseña segura.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-sm">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contraseña Actual</FormLabel>
                        <FormControl><Input type="password" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nueva Contraseña</FormLabel>
                        <FormControl><Input type="password" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                        <FormControl><Input type="password" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Guardar Contraseña</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Apariencia</CardTitle>
              <CardDescription>Personaliza la apariencia de la aplicación.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex items-center justify-between rounded-lg border p-4">
                 <div>
                    <Label htmlFor="dark-mode" className="font-semibold">Modo Oscuro</Label>
                    <p className="text-xs text-muted-foreground">Activa o desactiva el tema oscuro para el dashboard.</p>
                 </div>
                 <Switch
                    id="dark-mode"
                    checked={theme === 'dark'}
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                 />
               </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
