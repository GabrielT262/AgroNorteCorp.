
"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { addStockAction } from "@/app/actions/inventory-actions";
import type { InventoryItem } from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  productId: z.string({ required_error: 'Debe seleccionar un producto.' }),
  loteId: z.string().min(3, 'El ID del lote es requerido.'),
  quantity: z.coerce.number().min(0.1, 'La cantidad debe ser mayor a 0.'),
  expiryDate: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddStockDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  inventory: InventoryItem[];
}

export function AddStockDialog({ isOpen, onOpenChange, inventory }: AddStockDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, startTransition] = React.useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
        const result = await addStockAction({
            ...data,
            expiryDate: data.expiryDate ? format(data.expiryDate, 'yyyy-MM-dd') : undefined,
        });
        if(result.success) {
            toast({ title: "Stock Añadido", description: "El nuevo lote ha sido añadido al producto." });
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
          <DialogTitle>Añadir Stock a Producto Existente</DialogTitle>
          <DialogDescription>
            Selecciona un producto y registra un nuevo lote de entrada.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Producto</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar producto..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {inventory.map(item => (
                        <SelectItem key={item.id} value={item.id}>{item.name} ({item.id})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="loteId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID del Nuevo Lote</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: LOTE-2024-C" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad a Añadir</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ej: 100" {...field} step="0.01"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="expiryDate" render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Vencimiento del Lote (Opcional)</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                </FormItem>
            )} />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Añadir Lote
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
