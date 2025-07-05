'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ManagedUser, UserArea, UserRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { createUserAction, updateUserAction } from '@/app/actions/user-actions';
import { Loader2 } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const userAreas: UserArea[] = ['Gerencia', 'Logística', 'RR.HH', 'Seguridad Patrimonial', 'Almacén', 'Taller', 'Producción', 'Sanidad', 'SS.GG', 'Administrador'];
const userRoles: UserRole[] = ['Usuario', 'Administrador'];

const formSchema = z.object({
  username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres.'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres.'),
  email: z.string().email('Debe ser un correo electrónico válido.'),
  area: z.enum(userAreas, { required_error: 'Debe seleccionar un área.' }),
  role: z.enum(userRoles, { required_error: 'Debe seleccionar un rol.' }),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.').optional().or(z.literal('')),
  confirmPassword: z.string().optional(),
}).refine(data => {
    if (data.password && data.password !== data.confirmPassword) {
        return false;
    }
    return true;
}, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
});

type FormValues = z.infer<typeof formSchema>;

interface CreateUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: ManagedUser | null;
}

export function CreateUserDialog({ isOpen, onOpenChange, initialData }: CreateUserDialogProps) {
  const { toast } = useToast();
  const isEditMode = !!initialData;
  const [isSubmitting, startSubmitTransition] = React.useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  React.useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialData) {
        form.reset({
          username: initialData.username,
          name: initialData.name,
          lastName: initialData.lastName,
          email: initialData.email,
          area: initialData.area,
          role: initialData.role,
          password: '',
          confirmPassword: '',
        });
      } else {
        form.reset({ username: '', name: '', lastName: '', email: '', area: undefined, role: undefined, password: '', confirmPassword: '' });
      }
    }
  }, [isOpen, isEditMode, initialData, form]);
  
  const onSubmit = (data: FormValues) => {
    startSubmitTransition(async () => {
      let result;
      if (isEditMode && initialData) {
          const updateData: Partial<Omit<ManagedUser, 'id'>> = {
              username: data.username,
              name: data.name,
              lastName: data.lastName,
              email: data.email,
              area: data.area,
              role: data.role,
          };
          if (data.password) {
              updateData.password = data.password;
          }
          result = await updateUserAction(initialData.id, updateData);
          if (result.success) {
            toast({ title: 'Usuario Actualizado', description: 'Los datos del usuario han sido guardados.' });
          }
      } else {
          if (!data.password) {
              toast({ title: 'Contraseña requerida', description: 'Debe establecer una contraseña para el nuevo usuario.', variant: 'destructive' });
              return;
          }
          result = await createUserAction({
              username: data.username,
              name: data.name,
              lastName: data.lastName,
              email: data.email,
              area: data.area,
              role: data.role,
              password: data.password!,
          });
           if (result.success) {
            toast({ title: 'Usuario Creado', description: 'El nuevo usuario ha sido añadido al sistema.' });
          }
      }

      if (result?.success) {
        onOpenChange(false);
      } else if(result) {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Actualiza los detalles del usuario.' : 'Completa los detalles para crear una nueva cuenta.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField control={form.control} name="username" render={({ field }) => (
                <FormItem>
                    <FormLabel>Nombre de Usuario</FormLabel>
                    <FormControl><Input placeholder="Ej: jperez" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl><Input placeholder="Ej: Juan" {...field} /></FormControl>
                      <FormMessage />
                  </FormItem>
              )} />
               <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Apellidos</FormLabel>
                      <FormControl><Input placeholder="Ej: Perez" {...field} /></FormControl>
                      <FormMessage />
                  </FormItem>
              )} />
            </div>
             <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl><Input type="email" placeholder="Ej: j.perez@correo.com" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="area" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Área</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                        <SelectContent>{userAreas.map(area => <SelectItem key={area} value={area}>{area}</SelectItem>)}</SelectContent>
                    </Select><FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="role" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                        <SelectContent>{userRoles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}</SelectContent>
                    </Select><FormMessage />
                    </FormItem>
                )} />
            </div>
             <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl><Input type="password" placeholder={isEditMode ? 'Dejar en blanco para no cambiar' : 'Mínimo 6 caracteres'} {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
             <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                <FormItem>
                    <FormLabel>Confirmar Contraseña</FormLabel>
                    <FormControl><Input type="password" placeholder="Repetir contraseña" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                {isEditMode ? 'Guardar Cambios' : 'Crear Usuario'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
