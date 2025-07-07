
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerVehicleEntryAction, findVehicleByEmployeeIdAction } from '@/app/actions/security-actions';
import type { UserArea, ManagedUser } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getUsers } from '@/lib/db';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const userAreas: UserArea[] = ['Gerencia', 'Logística', 'RR.HH', 'Seguridad Patrimonial', 'Almacén', 'Taller', 'Producción', 'Sanidad', 'SS.GG', 'Administrador'];

const formSchema = z.object({
  employee_id: z.string({ required_error: 'Debe seleccionar un empleado.' }),
  employee_area: z.enum(userAreas, { required_error: 'Debe seleccionar un área.' }),
  vehicle_type: z.string().min(3, 'El tipo de vehículo es requerido.'),
  vehicle_model: z.string().min(3, 'El modelo es requerido.'),
  vehicle_plate: z.string().min(5, 'La placa es requerida.'),
});

type FormValues = z.infer<typeof formSchema>;

interface RegisterVehicleEntryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RegisterVehicleEntryDialog({ isOpen, onOpenChange }: RegisterVehicleEntryDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, startSubmitTransition] = React.useTransition();
  const [employees, setEmployees] = React.useState<ManagedUser[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset();
      getUsers().then(setEmployees);
    }
  }, [isOpen, form]);
  
  const handleEmployeeChange = async (employeeId: string) => {
    if (!employeeId) return;
    
    const selectedEmployee = employees.find(e => e.id === employeeId);
    if (selectedEmployee) {
        form.setValue('employee_area', selectedEmployee.area);
    }
    
    const existingVehicle = await findVehicleByEmployeeIdAction(employeeId);
    if (existingVehicle) {
      form.setValue('vehicle_type', existingVehicle.vehicle_type);
      form.setValue('vehicle_model', existingVehicle.vehicle_model);
      form.setValue('vehicle_plate', existingVehicle.vehicle_plate);
      toast({ title: 'Vehículo Encontrado', description: `Se autocompletaron los datos para el vehículo de este empleado.`});
    }
  };

  const onSubmit = (data: FormValues) => {
    startSubmitTransition(async () => {
        const result = await registerVehicleEntryAction(data);
        if (result.success) {
            toast({ title: "Ingreso Registrado", description: `El ingreso vehicular ha sido registrado.` });
            onOpenChange(false);
        } else {
            toast({ title: "Error", description: result.message || "No se pudo registrar el ingreso.", variant: "destructive" });
        }
    });
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
                    name="employee_id"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nombre del Empleado</FormLabel>
                        <Select onValueChange={(value) => { field.onChange(value); handleEmployeeChange(value); }} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar empleado..." /></SelectTrigger></FormControl>
                            <SelectContent>
                                {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name} {e.last_name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="employee_area" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Área</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                            <SelectContent>{userAreas.map(area => <SelectItem key={area} value={area}>{area}</SelectItem>)}</SelectContent>
                        </Select><FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="vehicle_plate" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Placa</FormLabel>
                        <FormControl><Input placeholder="Ej: ABC-123" {...field} /></FormControl><FormMessage />
                        </FormItem>
                    )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="vehicle_type" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Tipo de Vehículo</FormLabel>
                        <FormControl><Input placeholder="Ej: Auto, Moto, Camioneta" {...field} /></FormControl><FormMessage />
                        </FormItem>
                    )} />
                     <FormField control={form.control} name="vehicle_model" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Marca y Modelo</FormLabel>
                        <FormControl><Input placeholder="Ej: Toyota Hilux" {...field} /></FormControl><FormMessage />
                        </FormItem>
                    )} />
                </div>
            </div>
            <DialogFooter className="pt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar Ingreso
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
