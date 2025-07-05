'use client';

import * as React from 'react';
import { useUsers } from '@/context/users-context';
import type { ManagedUser } from '@/lib/types';
import Link from 'next/link';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MoreVertical, Pencil, Trash2, MessageSquare } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CreateUserDialog } from './create-user-dialog';

export function ManageUsersClient() {
  const { users, deleteUser } = useUsers();
  const [isCreateDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<ManagedUser | null>(null);
  const [deletingUser, setDeletingUser] = React.useState<ManagedUser | null>(null);

  const handleOpenCreateDialog = () => {
    setEditingUser(null);
    setCreateDialogOpen(true);
  };

  const handleEdit = (user: ManagedUser) => {
    setEditingUser(user);
    setCreateDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingUser) return;
    deleteUser(deletingUser.id);
    setDeletingUser(null);
  };

  const handleNotifyByWhatsapp = (user: ManagedUser) => {
    if (!user.whatsappNumber) return;
    const message = encodeURIComponent(`Hola ${user.name}, tu cuenta en AgroNorte Corp ha sido aprobada. Ya puedes iniciar sesión.`);
    const whatsappLink = `https://wa.me/${user.whatsappNumber.replace(/\D/g, '')}?text=${message}`;
    window.open(whatsappLink, '_blank');
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Gestionar Usuarios</h1>
            <p className="text-muted-foreground">Crea, edita y elimina cuentas de usuario.</p>
          </div>
          <Button onClick={handleOpenCreateDialog}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Usuario
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuarios</CardTitle>
            <CardDescription>Un total de {users.length} usuarios en el sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.area}</TableCell>
                      <TableCell><Badge variant={user.role === 'Administrador' ? 'default' : 'secondary'}>{user.role}</Badge></TableCell>
                      <TableCell>{user.whatsappNumber || '-'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(user)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              <span>Editar</span>
                            </DropdownMenuItem>
                            {user.whatsappNumber && (
                              <DropdownMenuItem onClick={() => handleNotifyByWhatsapp(user)}>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                <span>Notificar Aprobación</span>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDeletingUser(user)} className="text-destructive focus:text-destructive" disabled={user.role === 'Administrador'}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Eliminar</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <CreateUserDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setCreateDialogOpen}
        initialData={editingUser}
      />

      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente al usuario "{deletingUser?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingUser(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
