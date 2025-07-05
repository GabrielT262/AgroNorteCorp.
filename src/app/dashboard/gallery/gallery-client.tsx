
'use client';

import * as React from 'react';
import type { User, GalleryPost } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { approvePostAction, rejectPostAction } from '@/app/actions/gallery-actions';

import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { GalleryCard } from '@/components/dashboard/gallery-card';
import { CreateGalleryPostDialog } from '@/components/dashboard/create-gallery-post-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface GalleryClientProps {
    initialPosts: GalleryPost[];
    currentUser: User;
}

export function GalleryClient({ initialPosts, currentUser }: GalleryClientProps) {
  const [isCreateOpen, setCreateOpen] = React.useState(false);
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  
  const canApprove = currentUser.role === 'Administrador' || currentUser.area === 'Gerencia';

  const approvedPosts = React.useMemo(() => initialPosts.filter(p => p.status === 'Aprobado').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [initialPosts]);
  const pendingPosts = React.useMemo(() => initialPosts.filter(p => p.status === 'Pendiente').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [initialPosts]);

  const handleAction = (action: () => Promise<any>, successMessage: string, errorMessage: string) => {
    startTransition(async () => {
        const result = await action();
        if (result.success) {
            toast({ title: 'Éxito', description: successMessage });
        } else {
            toast({ title: 'Error', description: result.message || errorMessage, variant: 'destructive' });
        }
    });
  };
  
  const handleApprove = (postId: string) => handleAction(() => approvePostAction(postId), 'Publicación aprobada.', 'No se pudo aprobar la publicación.');
  const handleReject = (postId: string) => handleAction(() => rejectPostAction(postId), 'Publicación rechazada.', 'No se pudo rechazar la publicación.');


  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Galería de Logros</h1>
            <p className="text-muted-foreground">Un espacio para celebrar nuestros éxitos como equipo.</p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Publicación
          </Button>
        </div>

        <Tabs defaultValue="approved" className="w-full">
            <TabsList className={!canApprove ? 'hidden' : 'grid w-full grid-cols-2 sm:max-w-md'}>
                <TabsTrigger value="approved">Logros Aprobados</TabsTrigger>
                <TabsTrigger value="pending">Pendientes de Aprobación</TabsTrigger>
            </TabsList>

            <TabsContent value="approved">
                {approvedPosts.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {approvedPosts.map(post => <GalleryCard key={post.id} post={post} />)}
                    </div>
                ) : (
                    <div className="col-span-full text-center py-16 bg-muted/50 rounded-lg">
                        <p className="text-lg font-semibold">No hay logros publicados.</p>
                        <p className="text-muted-foreground">¡Anímate a ser el primero en compartir un éxito!</p>
                    </div>
                )}
            </TabsContent>

            {canApprove && (
                <TabsContent value="pending">
                    {pendingPosts.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {pendingPosts.map(post => (
                                <GalleryCard 
                                    key={post.id} 
                                    post={post}
                                    showApprovalActions
                                    isPending={isPending}
                                    onApprove={() => handleApprove(post.id)}
                                    onReject={() => handleReject(post.id)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="col-span-full text-center py-16 bg-muted/50 rounded-lg">
                            <p className="text-lg font-semibold">No hay publicaciones pendientes.</p>
                            <p className="text-muted-foreground">Todo está al día.</p>
                        </div>
                    )}
                </TabsContent>
            )}
        </Tabs>
      </div>

      <CreateGalleryPostDialog isOpen={isCreateOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
