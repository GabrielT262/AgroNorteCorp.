
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { createGalleryPostAction } from '@/app/actions/gallery-actions';
import type { GalleryPost } from '@/lib/types';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X, Loader2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

const formSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres.'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres.'),
  aiHint: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateGalleryPostDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateGalleryPostDialog({ isOpen, onOpenChange }: CreateGalleryPostDialogProps) {
  const { toast } = useToast();
  const [photos, setPhotos] = React.useState<File[]>([]);
  const [isSubmitting, startSubmitTransition] = React.useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  React.useEffect(() => {
    if (!isOpen) {
      form.reset();
      setPhotos([]);
    }
  }, [isOpen, form]);
  
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files);
      if (photos.length + newPhotos.length > 5) {
        toast({ title: "Límite de fotos", description: "Puedes subir un máximo de 5 fotos.", variant: "destructive" });
        return;
      }
      setPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  }

  const onSubmit = (data: FormValues) => {
    if (photos.length === 0) {
        toast({ title: "Fotos requeridas", description: "Debes subir al menos una foto para la publicación.", variant: "destructive" });
        return;
    }

    // In a real app, file upload would happen here, returning URLs.
    // For the prototype, we'll pass empty arrays.
    const photoUrls: string[] = []; 

    const postData: Omit<GalleryPost, 'id' | 'date' | 'authorName' | 'authorArea' | 'status' | 'images'> = {
        title: data.title,
        description: data.description,
        aiHint: data.aiHint,
    };
    
    startSubmitTransition(async () => {
        const result = await createGalleryPostAction(postData, photoUrls);
        if (result.success) {
            toast({ title: "Publicación Enviada", description: "Tu logro ha sido enviado a aprobación." });
            onOpenChange(false);
        } else {
            toast({ title: "Error", description: result.message || "No se pudo crear la publicación.", variant: "destructive" });
        }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crear Publicación de Logro</DialogTitle>
          <DialogDescription>
            Comparte un éxito de tu equipo con toda la organización.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
             <ScrollArea className="max-h-[65vh] p-1">
                <div className="space-y-4 px-4 py-2">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Título del Logro</FormLabel>
                            <FormControl><Input placeholder="Ej: Cosecha récord de Uva" {...field} /></FormControl><FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Descripción</FormLabel>
                            <FormControl><Textarea placeholder="Describe el logro, el equipo involucrado y el impacto..." {...field} rows={5} /></FormControl><FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="space-y-2">
                        <FormLabel>Fotos (Requerido, máx. 5)</FormLabel>
                        <Button asChild variant="outline" size="sm">
                            <Label className="cursor-pointer"><Upload className="mr-2 h-4 w-4" />Subir Fotos <Input type="file" className="sr-only" accept="image/*" multiple onChange={handlePhotoChange} disabled={photos.length >= 5} /></Label>
                        </Button>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {photos.map((photo, index) => (
                                <div key={index} className="relative">
                                    <img src={URL.createObjectURL(photo)} alt="preview" className="h-20 w-20 rounded-md object-cover"/>
                                    <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => removePhoto(index)}><X className="h-4 w-4" /></Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <FormField
                        control={form.control}
                        name="aiHint"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Pista para IA (Opcional)</FormLabel>
                            <FormControl><Input placeholder="Ej: harvest grape field" {...field} /></FormControl>
                             <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </ScrollArea>
            <DialogFooter className="pt-4 mt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Enviar a Aprobación
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
