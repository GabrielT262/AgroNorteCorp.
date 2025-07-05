
'use client';

import * as React from 'react';
import { useGallery } from '@/context/gallery-context';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Check, X } from 'lucide-react';
import { GalleryCard } from '@/components/dashboard/gallery-card';
import { CreateGalleryPostDialog } from '@/components/dashboard/create-gallery-post-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Hardcoded current user for demonstration
const currentUser: User = { name: 'Gabriel T', role: 'Administrador', area: 'Administrador' };
// const currentUser: User = { name: 'Juan V', role: 'Usuario', area: 'Producción' };


export default function GalleryPage() {
  const { posts, approvePost, rejectPost } = useGallery();
  const [isCreateOpen, setCreateOpen] = React.useState(false);
  
  const canApprove = currentUser.role === 'Administrador' || currentUser.area === 'Gerencia';

  const approvedPosts = React.useMemo(() => posts.filter(p => p.status === 'Aprobado').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [posts]);
  const pendingPosts = React.useMemo(() => posts.filter(p => p.status === 'Pendiente').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [posts]);

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
                                    onApprove={() => approvePost(post.id)}
                                    onReject={() => rejectPost(post.id)}
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
