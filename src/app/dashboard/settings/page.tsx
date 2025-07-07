

'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from '@/context/theme-context';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfileAction } from '@/app/actions/user-actions';
import Image from 'next/image';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Lock, Palette, PenSquare, Loader2 } from 'lucide-react';

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
const MAX_IMAGE_SIZE_BYTES = 1 * 1024 * 1024; // 1MB

export default function SettingsPage() {
  const { setTheme, theme } = useTheme();
  const { toast } = useToast();
  const [isSavingProfile, startSavingProfileTransition] = React.useTransition();
  const [avatarError, setAvatarError] = React.useState<string | null>(null);
  const [signatureError, setSignatureError] = React.useState<string | null>(null);
  
  // These should come from a real user object from an auth context
  const currentUser = { id: 'usr_gabriel', name: 'Gabriel T', area: 'Administrador', avatar_url: 'https://placehold.co/100x100.png', signature_url: null };
  const profileFormRef = React.useRef<HTMLFormElement>(null);

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
  
  const validateFile = (file: File | null, type: 'avatar' | 'signature'): boolean => {
    const errorSetter = type === 'avatar' ? setAvatarError : setSignatureError;
    errorSetter(null);
    if (!file || file.size === 0) return true;

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      errorSetter(`La imagen no debe superar 1 MB.`);
      return false;
    }
    return true;
  };

  const handleProfileSave = () => {
    if (profileFormRef.current) {
      const formData = new FormData(profileFormRef.current);
      const avatarFile = formData.get('avatar') as File;
      const signatureFile = formData.get('signature') as File;

      const isAvatarValid = validateFile(avatarFile, 'avatar');
      const isSignatureValid = validateFile(signatureFile, 'signature');
      
      if (!isAvatarValid || !isSignatureValid) {
        toast({ title: 'Error de Validación', description: 'Por favor, corrige los errores en los archivos.', variant: 'destructive' });
        return;
      }
      
      startSavingProfileTransition(async () => {
        const result = await updateUserProfileAction(currentUser.id, formData);
        if (result.success) {
          toast({ title: 'Perfil Actualizado', description: 'Tus cambios han sido guardados.' });
        } else {
          toast({ title: 'Error', description: result.message || 'No se pudo actualizar tu perfil.', variant: 'destructive' });
        }
      });
    }
  };

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
           <form ref={profileFormRef}>
            <CardHeader>
              <CardTitle>Perfil Público</CardTitle>
              <CardDescription>Esta información, junto a tu foto y firma, será visible para otros usuarios.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>Foto de Perfil</Label>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={currentUser.avatar_url} alt="Admin" data-ai-hint="person portrait" />
                            <AvatarFallback>GT</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow">
                            <Input name="avatar" type="file" accept="image/*" />
                             {avatarError && <p className="text-sm font-medium text-destructive mt-2">{avatarError}</p>}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Firma Digital</Label>
                    <div className="flex items-center gap-4">
                        <div className="w-48 h-24 bg-muted rounded-md flex items-center justify-center p-2 relative overflow-hidden">
                            {currentUser.signature_url ? (
                                <Image src={currentUser.signature_url} alt="Firma actual" fill className="object-contain" />
                            ) : (
                                <span className="text-muted-foreground text-sm text-center">Vista Previa de la Firma</span>
                            )}
                        </div>
                        <div className="flex-grow">
                            <Input name="signature" type="file" accept="image/*" />
                            {signatureError && <p className="text-sm font-medium text-destructive mt-2">{signatureError}</p>}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input defaultValue={currentUser.name} disabled />
                </div>
                <div className="space-y-2">
                    <Label>Área</Label>
                    <Input defaultValue={currentUser.area} disabled />
                </div>
            </CardContent>
            <CardFooter>
                <Button type="button" onClick={handleProfileSave} disabled={isSavingProfile}>
                    {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar Cambios de Perfil
                </Button>
            </CardFooter>
           </form>
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
