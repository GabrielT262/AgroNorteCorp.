
"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { dispatchFuelAction } from "@/app/actions/fuel-actions";
import type { FuelType, Shift, UserArea, VehicleType, FuelDispatchFormValues } from "@/lib/types";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "../ui/scroll-area";
import { Loader2 } from "lucide-react";

const userAreas: UserArea[] = ['Gerencia', 'Logística', 'RR.HH', 'Seguridad Patrimonial', 'Almacén', 'Taller', 'Producción', 'Sanidad', 'SS.GG'];
const vehicleTypes: VehicleType[] = ['Tractor', 'Camión', 'Camioneta', 'Moto Lineal'];
const shifts: Shift[] = ['Día', 'Noche'];

const formSchema = z.object({
  fuel_type: z.enum(['Gasolina', 'Petróleo'], { required_error: 'Requerido' }),
  area: z.enum(userAreas, { required_error: 'Requerido' }),
  user_name: z.string().min(3, 'Debe tener al menos 3 caracteres'),
  shift: z.enum(shifts, { required_error: 'Requerido' }),
  vehicle_type: z.enum(vehicleTypes, { required_error: 'Requerido' }),
  vehicle_model: z.string().optional(),
  quantity: z.coerce.number().min(0.1, 'Debe ser mayor a 0'),
  horometro: z.coerce.number().optional(),
  kilometraje: z.coerce.number().optional(),
}).refine(data => !(data.vehicle_type === 'Tractor' && !data.horometro), {
    message: "Horómetro es requerido para Tractores",
    path: ["horometro"],
}).refine(data => !(data.vehicle_type === 'Camioneta' && !data.kilometraje), {
    message: "Kilometraje es requerido para Camionetas",
    path: ["kilometraje"],
});


interface DispatchFuelDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onFinished: () => void;
}

export function DispatchFuelDialog({ isOpen, onOpenChange, onFinished }: DispatchFuelDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, startTransition] = React.useTransition();
  
  const form = useForm<FuelDispatchFormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = (data: FuelDispatchFormValues) => {
    startTransition(async () => {
      const result = await dispatchFuelAction(data);
      if (result.success) {
        toast({ title: "Despacho Registrado", description: "Se ha registrado la salida de combustible." });
        onFinished();
        onOpenChange(false);
      } else {
        toast({ title: "Error", description: result.message || "No se pudo registrar el despacho.", variant: "destructive" });
      }
    });
  };
  
  React.useEffect(() => {
    if(!isOpen) {
        form.reset();
    }
  }, [isOpen, form]);

  const watchedVehicleType = form.watch("vehicle_type");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Despacho de Combustible</DialogTitle>
          <DialogDescription>
            Completa el formulario para registrar una salida de combustible.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="max-h-[60vh] p-1">
                <div className="space-y-4 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="fuel_type" render={({ field }) => (
                            <FormItem>
                            <FormLabel>Tipo de Combustible</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                                <SelectContent><SelectItem value="Gasolina">Gasolina</SelectItem><SelectItem value="Petróleo">Petróleo</SelectItem></SelectContent>
                            </Select><FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="quantity" render={({ field }) => (
                            <FormItem>
                            <FormLabel>Galones a Despachar</FormLabel>
                            <FormControl><Input type="number" placeholder="Ej: 10.5" {...field} step="0.01"/></FormControl><FormMessage />
                            </FormItem>
                        )} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="area" render={({ field }) => (
                            <FormItem>
                            <FormLabel>Área Solicitante</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                                <SelectContent><ScrollArea className="h-48">{userAreas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</ScrollArea></SelectContent>
                            </Select><FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="user_name" render={({ field }) => (
                            <FormItem>
                            <FormLabel>Usuario Solicitante</FormLabel>
                            <FormControl><Input placeholder="Nombre del usuario" {...field} /></FormControl><FormMessage />
                            </FormItem>
                        )} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <FormField control={form.control} name="vehicle_type" render={({ field }) => (
                            <FormItem>
                            <FormLabel>Tipo de Vehículo</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                                <SelectContent>{vehicleTypes.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                            </Select><FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="shift" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Turno</FormLabel>
                                <FormControl>
                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center space-x-4 pt-2">
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl><RadioGroupItem value="Día" /></FormControl>
                                            <FormLabel className="font-normal">Día</FormLabel>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl><RadioGroupItem value="Noche" /></FormControl>
                                            <FormLabel className="font-normal">Noche</FormLabel>
                                        </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                         )} />
                    </div>

                    {(watchedVehicleType === 'Tractor' || watchedVehicleType === 'Camioneta') && (
                        <FormField control={form.control} name="vehicle_model" render={({ field }) => (
                            <FormItem>
                            <FormLabel>Modelo del Vehículo</FormLabel>
                            <FormControl><Input placeholder="Ej: John Deere 6110D" {...field} /></FormControl><FormMessage />
                            </FormItem>
                        )} />
                    )}

                    {watchedVehicleType === 'Tractor' && (
                        <FormField control={form.control} name="horometro" render={({ field }) => (
                            <FormItem>
                            <FormLabel>Horómetro</FormLabel>
                            <FormControl><Input type="number" placeholder="Ingrese el horómetro" {...field} /></FormControl><FormMessage />
                            </FormItem>
                        )} />
                    )}
                    {watchedVehicleType === 'Camioneta' && (
                        <FormField control={form.control} name="kilometraje" render={({ field }) => (
                            <FormItem>
                            <FormLabel>Kilometraje</FormLabel>
                            <FormControl><Input type="number" placeholder="Ingrese el kilometraje" {...field} /></FormControl><FormMessage />
                            </FormItem>
                        )} />
                    )}
                </div>
            </ScrollArea>
            <DialogFooter className="pt-4 border-t mt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar Despacho
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
