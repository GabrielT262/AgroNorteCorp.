
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSecurity } from '@/context/security-context';
import type { UserArea } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { Upload, X } from 'lucide-react';

const userAreas: UserArea[] = ['Gerencia', 'Logística', 'RR.HH', 'Seguridad Patrimonial', 'Almacén', 'Taller', 'Producción', 'Sanidad', 'SS.GG', 'Administrador'];

const formSchema = z.object({
  employeeName: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  employeeArea: z.enum(userAreas, { required_error: 'Debe seleccionar un área.' }),
  vehicleType: z.string().min(3, 'El tipo de vehículo es requerido.'),
  vehicleModel: z.string().min(3, 'El modelo es requerido.'),
  vehiclePlate: z.string().min(5, 'La placa es requerida.'),
});

type FormValues = z.infer<typeof formSchema>;

interface RegisterVehicleEntryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RegisterVehicleEntryDialog({ isOpen, onOpenChange }: RegisterVehicleEntryDialogProps) {
  const { registeredVehicles, addVehicleEntry } = useSecurity();
  const { toast } = useToast();
  const [photo, setPhoto] = React.useState<File | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  React.useEffect(() => {
    if (!isOpen) {
      form.reset();
      setPhoto(null);
    }
  }, [isOpen, form]);
  
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const removePhoto = () => {
    setPhoto(null);
  }

  const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (!name) return;

    const existingVehicle = registeredVehicles.find(v => v.employeeName.toLowerCase() === name.toLowerCase());
    if (existingVehicle) {
      form.setValue('employeeArea', existingVehicle.employeeArea);
      form.setValue('vehicleType', existingVehicle.vehicleType);
      form.setValue('vehicleModel', existingVehicle.vehicleModel);
      form.setValue('vehiclePlate', existingVehicle.vehiclePlate);
      toast({ title: 'Empleado Encontrado', description: `Se autocompletaron los datos para ${existingVehicle.employeeName}.`});
    }
  };

  const onSubmit = (data: FormValues) => {
    addVehicleEntry(data, photo);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Registrar Ingreso de Vehículo</DialogTitle>
          <DialogDescription>
            Completa o verifica los datos del trabajador y su vehículo.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 py-2">
                <FormField
                    control={form.control}
                    name="employeeName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nombre del Empleado</FormLabel>
                        <FormControl>
                            <Input placeholder="Buscar o registrar nombre..." {...field} onBlur={handleNameBlur} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="employeeArea" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Área</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                            <SelectContent>{userAreas.map(area => <SelectItem key={area} value={area}>{area}</SelectItem>)}</SelectContent>
                        </Select><FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="vehiclePlate" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Placa</FormLabel>
                        <FormControl><Input placeholder="Ej: ABC-123" {...field} /></FormControl><FormMessage />
                        </FormItem>
                    )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="vehicleType" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Tipo de Vehículo</FormLabel>
                        <FormControl><Input placeholder="Ej: Auto, Moto, Camioneta" {...field} /></FormControl><FormMessage />
                        </FormItem>
                    )} />
                     <FormField control={form.control} name="vehicleModel" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Marca y Modelo</FormLabel>
                        <FormControl><Input placeholder="Ej: Toyota Hilux" {...field} /></FormControl><FormMessage />
                        </FormItem>
                    )} />
                </div>
                <div className="space-y-2">
                    <FormLabel>Foto del Vehículo (Opcional)</FormLabel>
                    {!photo ? (
                        <Button asChild variant="outline" size="sm">
                            <Label className="cursor-pointer"><Upload className="mr-2 h-4 w-4" />Subir Foto <Input type="file" className="sr-only" accept="image/*" onChange={handlePhotoChange} /></Label>
                        </Button>
                    ) : (
                        <div className="relative w-fit">
                            <img src={URL.createObjectURL(photo)} alt="preview" className="h-24 w-auto rounded-md object-cover"/>
                            <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={removePhoto}><X className="h-4 w-4" /></Button>
                        </div>
                    )}
                </div>
            </div>
            <DialogFooter className="pt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit">Registrar Ingreso</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
