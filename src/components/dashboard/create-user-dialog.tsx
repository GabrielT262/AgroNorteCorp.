'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUsers } from '@/context/users-context';
import type { ManagedUser, UserArea, UserRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const userAreas: UserArea[] = ['Gerencia', 'Logística', 'RR.HH', 'Seguridad Patrimonial', 'Almacén', 'Taller', 'Producción', 'Sanidad', 'SS.GG', 'Administrador'];
const userRoles: UserRole[] = ['Usuario', 'Administrador'];

const formSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  area: z.enum(userAreas, { required_error: 'Debe seleccionar un área.' }),
  role: z.enum(userRoles, { required_error: 'Debe seleccionar un rol.' }),
  whatsappNumber: z.string().optional(),
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
  const { addUser, updateUser } = useUsers();
  const { toast } = useToast();
  const isEditMode = !!initialData;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  React.useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialData) {
        form.reset({
          name: initialData.name,
          area: initialData.area,
          role: initialData.role,
          whatsappNumber: initialData.whatsappNumber || '',
          password: '',
          confirmPassword: '',
        });
      } else {
        form.reset({ name: '', area: undefined, role: undefined, whatsappNumber: '', password: '', confirmPassword: '' });
      }
    }
  }, [isOpen, isEditMode, initialData, form]);
  
  const onSubmit = (data: FormValues) => {
    if (!isEditMode && !data.password) {
        toast({ title: 'Contraseña requerida', description: 'Debe establecer una contraseña para el nuevo usuario.', variant: 'destructive' });
        return;
    }
    
    if (isEditMode && initialData) {
        const updateData: ManagedUser = {
            id: initialData.id,
            name: data.name,
            area: data.area,
            role: data.role,
            whatsappNumber: data.whatsappNumber,
        };
        if (data.password) {
            updateData.password = data.password;
        }
        updateUser(updateData);
    } else {
        addUser({
            name: data.name,
            area: data.area,
            role: data.role,
            whatsappNumber: data.whatsappNumber,
            password: data.password!,
        });
    }

    onOpenChange(false);
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
            <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl><Input placeholder="Ej: Juan Perez" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="whatsappNumber" render={({ field }) => (
                <FormItem>
                    <FormLabel>Número de WhatsApp (Opcional)</FormLabel>
                    <FormControl><Input placeholder="Ej: 51987654321" {...field} /></FormControl>
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
              <Button type="submit">{isEditMode ? 'Guardar Cambios' : 'Crear Usuario'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
