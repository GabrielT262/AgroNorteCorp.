

'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { createGalleryPostAction } from '@/app/actions/gallery-actions';
import { compressImage } from '@/lib/image-compressor';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

const formSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres.'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres.'),
  ai_hint: z.string().optional(),
  images: z.any()
    .refine((files) => files && files.length > 0, 'Debes subir al menos una imagen.'),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateGalleryPostDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateGalleryPostDialog({ isOpen, onOpenChange }: CreateGalleryPostDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, startSubmitTransition] = React.useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  React.useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  const onSubmit = (data: FormValues) => {
    startSubmitTransition(async () => {
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('description', data.description);
        if (data.ai_hint) formData.append('ai_hint', data.ai_hint);
        
        if (data.images && data.images.length > 0) {
            toast({ title: "Procesando imágenes...", description: "Comprimiendo imágenes antes de subirlas. Esto puede tardar un momento." });
            const imageFiles = Array.from(data.images as FileList);
            const compressedImages = await Promise.all(
              imageFiles.map(file => compressImage(file))
            );
            for (const image of compressedImages) {
              formData.append('images', image);
            }
        }
        
        const result = await createGalleryPostAction(formData);
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
                     <FormField
                        control={form.control}
                        name="images"
                        render={({ field: { onChange, value, ...rest } }) => (
                            <FormItem>
                                <FormLabel>Imágenes del Logro</FormLabel>
                                <FormControl>
                                    <Input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={(e) => onChange(e.target.files)}
                                        {...rest}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="ai_hint"
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
