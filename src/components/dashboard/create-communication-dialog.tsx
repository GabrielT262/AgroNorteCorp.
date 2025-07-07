'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { createCommunicationAction } from '@/app/actions/communication-actions';

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';

const formSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres.'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres.'),
  ai_hint: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateCommunicationDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateCommunicationDialog({ isOpen, onOpenChange }: CreateCommunicationDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, startSubmitTransition] = React.useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: '', description: '', ai_hint: '' }
  });

  const onSubmit = (data: FormValues) => {
    startSubmitTransition(async () => {
        const result = await createCommunicationAction(data);
        if (result.success) {
            toast({ title: "Comunicado Publicado", description: "El comunicado ya está visible para la organización." });
            form.reset();
            onOpenChange(false);
        } else {
            toast({ title: "Error", description: result.message || "No se pudo publicar el comunicado.", variant: "destructive" });
        }
    });
  };

  React.useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Comunicado</DialogTitle>
          <DialogDescription>Redacta y publica anuncios para toda la organización.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
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
                  name="ai_hint"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Pista para IA (Opcional)</FormLabel>
                      <FormControl><Input placeholder="Ej: meeting announcement" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                  )}
              />
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Publicar Comunicado
                </Button>
              </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
