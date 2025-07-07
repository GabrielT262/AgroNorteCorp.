'use client';

import * as React from 'react';
import type { Communication, User, UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Megaphone, Eye } from 'lucide-react';
import { CreateCommunicationDialog } from '@/components/dashboard/create-communication-dialog';
import { CommunicationDialog } from '@/components/dashboard/communication-dialog';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface CommunicationsClientProps {
  initialCommunications: Communication[];
  currentUser: User;
}

export function CommunicationsClient({ initialCommunications, currentUser }: CommunicationsClientProps) {
  const [isCreateOpen, setCreateOpen] = React.useState(false);
  const [viewingCommunication, setViewingCommunication] = React.useState<Communication | null>(null);
  
  const canCreateRoles: UserRole[] = ['Logística', 'Almacén', 'Gerencia', 'Administrador'];
  const userCanCreate = canCreateRoles.includes(currentUser.role);

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
              <Megaphone />
              Comunicados
            </h1>
            <p className="text-muted-foreground">Anuncios importantes para toda la organización.</p>
          </div>
          {userCanCreate && (
            <Button onClick={() => setCreateOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear Comunicado
            </Button>
          )}
        </div>
        
        {initialCommunications.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {initialCommunications.map(comm => {
                const authorName = comm.users ? `${comm.users.name} ${comm.users.last_name}` : 'Sistema';
                return (
                <Card key={comm.id}>
                    <CardHeader>
                        <CardTitle>{comm.title}</CardTitle>
                        <CardDescription>
                            Por {authorName} el {format(parseISO(comm.date), "dd MMMM, yyyy", { locale: es })}
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button variant="outline" className="w-full" onClick={() => setViewingCommunication(comm)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Leer comunicado
                        </Button>
                    </CardFooter>
                </Card>
            )})}
          </div>
        ) : (
          <div className="col-span-full text-center py-16 bg-muted/50 rounded-lg">
            <p className="text-lg font-semibold">No hay comunicados.</p>
            <p className="text-muted-foreground">Aquí aparecerán los anuncios de la empresa.</p>
          </div>
        )}
      </div>

      <CreateCommunicationDialog isOpen={isCreateOpen} onOpenChange={setCreateOpen} />
      <CommunicationDialog communication={viewingCommunication} isOpen={!!viewingCommunication} onOpenChange={() => setViewingCommunication(null)} />
    </>
  );
}
