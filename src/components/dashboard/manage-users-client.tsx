'use client';

import * as React from 'react';
import type { ManagedUser, UserRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { deleteUserAction, approveUserAction } from '@/app/actions/user-actions';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MoreVertical, Pencil, Trash2, Loader2, Mail, CheckCircle } from 'lucide-react';
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

interface ManageUsersClientProps {
  initialUsers: ManagedUser[];
  currentUser: ManagedUser;
}

export function ManageUsersClient({ initialUsers, currentUser }: ManageUsersClientProps) {
  const { toast } = useToast();
  const [isCreateDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<ManagedUser | null>(null);
  const [deletingUser, setDeletingUser] = React.useState<ManagedUser | null>(null);
  const [isPending, startTransition] = React.useTransition();

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
    startTransition(async () => {
      const result = await deleteUserAction(deletingUser.id);
      if (result.success) {
        toast({ title: 'Usuario Eliminado', description: `El usuario "${deletingUser.name}" ha sido eliminado.`});
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
      setDeletingUser(null);
    });
  };
  
  const handleApprove = (userId: string, userName: string) => {
    startTransition(async () => {
      const result = await approveUserAction(userId);
      if (result.success) {
        toast({ title: 'Usuario Aprobado', description: `El usuario "${userName}" ha sido activado.`});
      } else {
        toast({ title: 'Error al Aprobar', description: result.message, variant: 'destructive' });
      }
    });
  };

  const handleNotifyByEmail = (user: ManagedUser) => {
    if (!user.email) return;
    const subject = encodeURIComponent(`Tu cuenta en AgroNorte Corp ha sido aprobada`);
    const body = encodeURIComponent(`Hola ${user.name},\n\nTu cuenta en AgroNorte Corp ha sido aprobada. Ya puedes iniciar sesión.`);
    const mailtoLink = `mailto:${user.email}?subject=${subject}&body=${body}`;
    window.open(mailtoLink, '_blank');
  };
  
  const canManageUsers = currentUser.role === 'Administrador';
  if (!canManageUsers) {
      return (
        <Card>
            <CardHeader>
                <CardTitle>Acceso Denegado</CardTitle>
            </CardHeader>
            <CardContent>
                <p>No tienes permiso para gestionar usuarios.</p>
            </CardContent>
        </Card>
      );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Gestionar Usuarios</h1>
            <p className="text-muted-foreground">Crea, edita, aprueba y elimina cuentas de usuario.</p>
          </div>
          <Button onClick={handleOpenCreateDialog}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Usuario
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuarios</CardTitle>
            <CardDescription>Un total de {initialUsers.length} usuarios en el sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Área / Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono">{user.username}</TableCell>
                      <TableCell className="font-medium">{user.name} {user.last_name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                            <span>{user.email}</span>
                            <span className="text-xs text-muted-foreground">{user.whatsapp_number}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant={user.role === 'Administrador' ? 'default' : 'secondary'}>{user.role}</Badge></TableCell>
                       <TableCell>
                        <Badge variant={user.status === 'active' ? 'secondary' : 'destructive'}>
                          {user.status === 'active' ? 'Activo' : 'Pendiente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {isPending && <Loader2 className="h-4 w-4 animate-spin ml-auto" />}
                        {!isPending && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {user.status === 'pending' && (
                                <DropdownMenuItem onClick={() => handleApprove(user.id, user.name)}>
                                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                  <span>Aprobar Usuario</span>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleEdit(user)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                <span>Editar</span>
                              </DropdownMenuItem>
                              {user.email && user.status === 'active' && (
                                <DropdownMenuItem onClick={() => handleNotifyByEmail(user)}>
                                  <Mail className="mr-2 h-4 w-4" />
                                  <span>Notificar Aprobación</span>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDeletingUser(user)} className="text-destructive focus:text-destructive" disabled={user.username === 'GabrielT'}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Eliminar</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
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
              Esta acción no se puede deshacer. Esto eliminará permanentemente al usuario "{deletingUser?.name} {deletingUser?.last_name}".
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
