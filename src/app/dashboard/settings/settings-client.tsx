
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from '@/context/theme-context';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfileAction } from '@/app/actions/user-actions';
import Image from 'next/image';
import type { ManagedUser } from '@/lib/types';
import { compressImage } from '@/lib/image-compressor';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Lock, Palette, PenSquare, Loader2, Image as ImageIcon } from 'lucide-react';

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

interface SettingsClientProps {
    currentUser: ManagedUser;
}

export default function SettingsClient({ currentUser }: SettingsClientProps) {
  const { setTheme, theme } = useTheme();
  const { toast } = useToast();
  const [isSavingProfile, startSavingProfileTransition] = React.useTransition();
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [signatureFile, setSignatureFile] = React.useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = React.useState<string | null>(null);
  
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const signatureInputRef = React.useRef<HTMLInputElement>(null);

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onPasswordSubmit = (data: PasswordFormValues) => {
    console.log(data);
    toast({
      title: 'Contraseña Actualizada',
      description: 'Tu contraseña ha sido cambiada exitosamente.',
    });
    passwordForm.reset();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'signature') => {
    const file = e.target.files?.[0] || null;
    const previewSetter = type === 'avatar' ? setAvatarPreview : setSignaturePreview;

    if (!file) {
      if (type === 'avatar') setAvatarFile(null);
      else setSignatureFile(null);
      previewSetter(null);
      return;
    }

    if (type === 'avatar') {
      setAvatarFile(file);
    } else {
      setSignatureFile(file);
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      previewSetter(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSave = () => {
    if (!avatarFile && !signatureFile) {
      toast({ title: 'Sin cambios', description: 'No has seleccionado ninguna imagen nueva.' });
      return;
    }

    startSavingProfileTransition(async () => {
      const formData = new FormData();

      if (avatarFile) {
        toast({ title: 'Procesando foto...', description: 'La imagen se está comprimiendo.' });
        const compressed = await compressImage(avatarFile);
        formData.append('avatar', compressed, compressed.name);
      }
      if (signatureFile) {
        toast({ title: 'Procesando firma...', description: 'La imagen se está comprimiendo.' });
        const compressed = await compressImage(signatureFile);
        formData.append('signature', compressed, compressed.name);
      }

      const result = await updateUserProfileAction(currentUser.id, formData);
      if (result.success) {
        toast({ title: 'Perfil Actualizado', description: 'Tus cambios han sido guardados.' });
        setAvatarPreview(null);
        setSignaturePreview(null);
        setAvatarFile(null);
        setSignatureFile(null);
        if (avatarInputRef.current) avatarInputRef.current.value = '';
        if (signatureInputRef.current) signatureInputRef.current.value = '';
      } else {
        toast({ title: 'Error', description: result.message || 'No se pudo actualizar tu perfil.', variant: 'destructive' });
      }
    });
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
           <form>
            <CardHeader>
              <CardTitle>Perfil Público</CardTitle>
              <CardDescription>Esta información, junto a tu foto y firma, será visible para otros usuarios.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="space-y-2">
                    <Label>Foto de Perfil</Label>
                    <div className="flex items-center gap-6">
                        <Avatar className="h-20 w-20 ring-2 ring-offset-2 ring-primary/50">
                            <AvatarImage src={avatarPreview || currentUser.avatar_url || undefined} alt="Admin" data-ai-hint="person portrait" />
                            <AvatarFallback>{currentUser.name.charAt(0)}{currentUser.last_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow space-y-2">
                             <Button type="button" variant="outline" onClick={() => avatarInputRef.current?.click()}>
                                <ImageIcon className="mr-2" /> Cambiar Foto
                            </Button>
                            <Input ref={avatarInputRef} name="avatar" type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, 'avatar')} />
                            <p className="text-xs text-muted-foreground">Sube un archivo de imagen (JPG, PNG). Se comprimirá si supera 1MB.</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Firma Digital</Label>
                    <div className="flex items-center gap-6">
                        <div className="w-48 h-24 bg-muted rounded-md flex items-center justify-center p-2 relative overflow-hidden ring-2 ring-offset-2 ring-primary/50">
                            <Image src={signaturePreview || currentUser.signature_url || 'https://placehold.co/400x200.png'} alt="Vista previa de la firma" fill className="object-contain" />
                        </div>
                        <div className="flex-grow space-y-2">
                             <Button type="button" variant="outline" onClick={() => signatureInputRef.current?.click()}>
                                <PenSquare className="mr-2" /> Cambiar Firma
                            </Button>
                            <Input ref={signatureInputRef} name="signature" type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, 'signature')}/>
                            <p className="text-xs text-muted-foreground">Sube una imagen de tu firma. Se comprimirá si supera 1MB.</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input defaultValue={`${currentUser.name} ${currentUser.last_name}`} disabled />
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
