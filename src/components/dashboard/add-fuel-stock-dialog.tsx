
"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { addFuelStockAction } from "@/app/actions/fuel-actions";
import type { FuelType } from "@/lib/types";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";


const formSchema = z.object({
  fuelType: z.enum(['Gasolina', 'Petróleo'], { required_error: 'Debe seleccionar un tipo de combustible.' }),
  quantity: z.coerce.number().min(0.1, 'La cantidad debe ser mayor a 0.'),
});

type FormValues = z.infer<typeof formSchema>;

interface AddFuelStockDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onFinished: () => void;
}

export function AddFuelStockDialog({ isOpen, onOpenChange, onFinished }: AddFuelStockDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, startTransition] = React.useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: 0,
    },
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
        const result = await addFuelStockAction(data);
        if(result.success) {
            toast({ title: "Stock Añadido", description: "El nivel de combustible ha sido actualizado." });
            onFinished();
            onOpenChange(false);
        } else {
            toast({ title: "Error", description: result.message || "No se pudo añadir el stock.", variant: "destructive"});
        }
    });
  };
  
  React.useEffect(() => {
    if(!isOpen) {
        form.reset();
    }
  }, [isOpen, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Añadir Stock de Combustible</DialogTitle>
          <DialogDescription>
            Registra una nueva entrada de combustible a los tanques principales.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="fuelType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Combustible</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Gasolina">Gasolina</SelectItem>
                      <SelectItem value="Petróleo">Petróleo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad (galones)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ej: 150.5" {...field} step="0.01"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Añadir Stock
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
