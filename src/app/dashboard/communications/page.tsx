
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { createCommunicationAction } from '@/app/actions/communication-actions';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Megaphone, Send, Loader2 } from 'lucide-react';

const formSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres.'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres.'),
  aiHint: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CommunicationsPage() {
  const { toast } = useToast();
  const [isSubmitting, startSubmitTransition] = React.useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      aiHint: '',
    }
  });

  const onSubmit = (data: FormValues) => {
    const communicationData = {
        title: data.title,
        description: data.description,
        aiHint: data.aiHint,
    };

    startSubmitTransition(async () => {
        const result = await createCommunicationAction(communicationData);
        if (result.success) {
            toast({ title: "Comunicado Publicado", description: "El comunicado ya está visible para la organización." });
            form.reset();
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
