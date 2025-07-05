
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { createCommunicationAction } from '@/app/actions/communication-actions';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X, Megaphone, Send, Loader2 } from 'lucide-react';

const formSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres.'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres.'),
  aiHint: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CommunicationsPage() {
  const { toast } = useToast();
  const [photos, setPhotos] = React.useState<File[]>([]);
  const [isSubmitting, startSubmitTransition] = React.useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      aiHint: '',
    }
  });
  
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
    // In a real app, file upload would happen here, returning URLs.
    // For the prototype, we'll pass empty arrays.
    const photoUrls: string[] = []; 

    const communicationData = {
        title: data.title,
        description: data.description,
        aiHint: data.aiHint,
    };

    startSubmitTransition(async () => {
        const result = await createCommunicationAction(communicationData, photoUrls);
        if (result.success) {
            toast({ title: "Comunicado Publicado", description: "El comunicado ya está visible para la organización." });
            form.reset();
            setPhotos([]);
        } else {
            toast({ title: "Error", description: result.message || "No se pudo publicar el comunicado.", variant: "destructive" });
        }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
                <Megaphone />
                Crear Comunicado
            </h1>
            <p className="text-muted-foreground">Redacta y publica anuncios para toda la organización.</p>
        </div>
      </div>
      
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="pt-6 space-y-6">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Título del Comunicado</FormLabel>
                        <FormControl><Input placeholder="Ej: Anuncio de Mantenimiento General" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Contenido del Mensaje</FormLabel>
                        <FormControl><Textarea placeholder="Describe el comunicado en detalle..." {...field} rows={8} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="space-y-2">
                    <FormLabel>Fotos (Opcional, máx. 5)</FormLabel>
                    <Button asChild variant="outline" size="sm">
                        <Label className="cursor-pointer"><Upload className="mr-2 h-4 w-4" />Subir Fotos <Input type="file" className="sr-only" accept="image/*" multiple onChange={handlePhotoChange} disabled={photos.length >= 5} /></Label>
                    </Button>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {photos.map((photo, index) => (
                            <div key={index} className="relative">
                                <img src={URL.createObjectURL(photo)} alt="preview" className="h-24 w-24 rounded-md object-cover"/>
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
                        <FormControl><Input placeholder="Ej: meeting announcement" {...field} /></FormControl>
                         <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
            <CardFooter className="flex justify-end border-t pt-6">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Publicar Comunicado
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
