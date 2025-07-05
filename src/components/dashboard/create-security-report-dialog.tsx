
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSecurity } from '@/context/security-context';
import type { SecurityReport } from '@/lib/types';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Paperclip } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

const reportTypes: SecurityReport['type'][] = ['Novedad', 'Incidente', 'Solicitud de Permiso', 'Ingreso de Proveedor'];

const formSchema = z.object({
  type: z.enum(reportTypes, { required_error: 'Debe seleccionar un tipo de reporte.' }),
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres.'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres.'),
  metaDetails: z.string().optional(),
}).refine(data => {
    if ((data.type === 'Solicitud de Permiso' || data.type === 'Ingreso de Proveedor') && (!data.metaDetails || data.metaDetails.length < 10)) {
        return false;
    }
    return true;
}, {
    message: 'Los detalles son requeridos y deben tener al menos 10 caracteres.',
    path: ['metaDetails'],
});

type FormValues = z.infer<typeof formSchema>;

interface CreateSecurityReportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSecurityReportDialog({ isOpen, onOpenChange }: CreateSecurityReportDialogProps) {
  const { addReport } = useSecurity();
  const { toast } = useToast();
  const [photos, setPhotos] = React.useState<File[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const watchedType = form.watch('type');

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
    const reportData: Omit<SecurityReport, 'id' | 'date' | 'author'> = {
        title: data.title,
        description: data.description,
        type: data.type,
        photos: [], // Placeholder for uploaded photo URLs
        status: data.type === 'Solicitud de Permiso' ? 'Aprobación Pendiente' : 'Abierto',
    };
    
    if (data.type === 'Solicitud de Permiso') {
        reportData.meta = { targetArea: 'Gerencia', details: data.metaDetails! };
    } else if (data.type === 'Ingreso de Proveedor') {
        reportData.meta = { targetArea: 'Almacén', details: data.metaDetails! };
    }

    addReport(reportData);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Reporte de Seguridad</DialogTitle>
          <DialogDescription>
            Completa la información para registrar una nueva entrada en la bitácora.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
             <ScrollArea className="max-h-[65vh] p-1">
                <div className="space-y-4 px-4 py-2">
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Tipo de Reporte</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar tipo..." /></SelectTrigger></FormControl>
                                <SelectContent>{reportTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                            </Select><FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Título</FormLabel>
                            <FormControl><Input placeholder="Ej: Falla en cerco eléctrico" {...field} /></FormControl><FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Descripción</FormLabel>
                            <FormControl><Textarea placeholder="Describe la novedad o incidente en detalle..." {...field} rows={5} /></FormControl><FormMessage />
                            </FormItem>
                        )}
                    />
                     {(watchedType === 'Solicitud de Permiso' || watchedType === 'Ingreso de Proveedor') && (
                         <FormField
                            control={form.control}
                            name="metaDetails"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Detalles para {watchedType === 'Solicitud de Permiso' ? 'Gerencia' : 'Almacén'}</FormLabel>
                                <FormControl><Textarea placeholder={`Describe la solicitud para ${watchedType === 'Solicitud de Permiso' ? 'Gerencia' : 'Almacén'}...`} {...field} /></FormControl><FormMessage />
                                </FormItem>
                            )}
                        />
                     )}

                    <div className="space-y-2">
                        <FormLabel>Fotos (Opcional, máx. 5)</FormLabel>
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
                </div>
            </ScrollArea>
            <DialogFooter className="pt-4 mt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit">Guardar Reporte</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
