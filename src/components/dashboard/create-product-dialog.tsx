

"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { cn } from "@/lib/utils";
import type { InventoryCategory, InventoryUnit, InventoryCultivo, UserArea, InventoryItem, Batch } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { createProductAction } from "@/app/actions/inventory-actions";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";

const categories: InventoryCategory[] = ["Herramientas", "Repuestos", "Fertilizantes", "Agroquímicos", "Varios", "Implementos de Riego", "Implementos de SST"];
const units: InventoryUnit[] = ['Unidad', 'Kg', 'Litros', 'Metros'];
const cultivos: InventoryCultivo[] = ['Uva', 'Palto'];
const userAreas: UserArea[] = ['Gerencia', 'Logística', 'RR.HH', 'Seguridad Patrimonial', 'Almacén', 'Taller', 'Producción', 'Sanidad', 'SS.GG', 'Administrador'];

const MAX_IMAGE_SIZE_MB = 1;
const MAX_PDF_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const MAX_PDF_SIZE_BYTES = MAX_PDF_SIZE_MB * 1024 * 1024;

const productFormSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  sku: z.string().min(3, "El SKU debe tener al menos 3 caracteres."),
  description: z.string().optional(),
  location: z.string().min(3, "La ubicación es requerida."),
  category: z.enum(categories, { required_error: "Debes seleccionar una categoría." }),
  area: z.enum(userAreas, { required_error: "Debes seleccionar un área." }),
  cultivo: z.enum(cultivos).optional(),
  unit: z.enum(units, { required_error: "Debes seleccionar una unidad." }),
  images: z.any()
    .refine((files) => !files || files.length === 0 || Array.from(files).every((file: any) => file.size <= MAX_IMAGE_SIZE_BYTES), {
        message: `Cada imagen no debe superar ${MAX_IMAGE_SIZE_MB} MB.`,
    }),
  technicalSheet: z.any()
    .refine((files) => !files || files.length === 0 || files[0].size <= MAX_PDF_SIZE_BYTES, {
        message: `El archivo PDF no debe superar los ${MAX_PDF_SIZE_MB} MB.`,
    })
    .refine((files) => !files || files.length === 0 || files[0].type === 'application/pdf', {
        message: 'Solo se permiten archivos en formato PDF.',
    }),
  // Batch fields
  loteId: z.string().min(3, "El ID del lote debe tener al menos 3 caracteres."),
  stock: z.coerce.number().min(0, "La cantidad no puede ser negativa."),
  expiryDate: z.date().optional(),

}).refine(data => {
  if ((data.category === 'Agroquímicos' || data.category === 'Fertilizantes') && !data.cultivo) {
    return false;
  }
  return true;
}, {
  message: "El cultivo es requerido para Agroquímicos y Fertilizantes.",
  path: ["cultivo"],
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface CreateProductDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProductDialog({ isOpen, onOpenChange }: CreateProductDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, startTransition] = React.useTransition();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
  });

  React.useEffect(() => {
    if (isOpen) {
        form.reset({ stock: 0, name: '', sku: '', description: '', location: '', category: undefined, unit: undefined, cultivo: undefined, area: undefined, expiryDate: undefined, loteId: '' });
    }
  }, [isOpen, form]);
  
  const watchedCategory = form.watch("category");

  function onSubmit(data: ProductFormValues) {
    startTransition(async () => {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (key === 'images' && value) {
                for (let i = 0; i < value.length; i++) {
                    formData.append('images', value[i]);
                }
            } else if (key === 'technicalSheet' && value && value.length > 0) {
                formData.append('technicalSheet', value[0]);
            } else if (value instanceof Date) {
                formData.append(key, value.toISOString());
            } else if (value !== undefined && value !== null) {
                formData.append(key, value.toString());
            }
        });

        const productToSave: Omit<InventoryItem, 'batches' | 'images' | 'technical_sheet_url'> = {
          id: data.sku,
          name: data.name,
          description: data.description || '',
          category: data.category,
          area: data.area,
          cultivo: data.cultivo,
          location: data.location,
          unit: data.unit,
          ai_hint: `${data.category} ${data.name}`,
        };

        const initialBatch: Batch = {
            id: data.loteId,
            stock: data.stock,
            expiry_date: data.expiryDate ? format(data.expiryDate, 'yyyy-MM-dd') : undefined,
        };

        const result = await createProductAction(productToSave, initialBatch, formData);
        if (result.success) {
            toast({
                title: "Producto Creado",
                description: `El producto "${data.name}" ha sido añadido al inventario.`,
            });
            onOpenChange(false);
        } else {
            toast({ title: "Error", description: result.message || "No se pudo guardar.", variant: "destructive" });
        }
    });
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Crear Nuevo Producto</DialogTitle>
          <DialogDescription>
            Completa los detalles para añadir un nuevo producto y su lote inicial al inventario.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6">
          <Form {...form}>
            <form id="product-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <h4 className="text-lg font-semibold border-b pb-2">Información del Producto</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Producto</FormLabel>
                    <FormControl><Input placeholder="Ej: Herbicida Glifosato 5L" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="sku" render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU (Código único)</FormLabel>
                    <FormControl><Input placeholder="Ej: AGRO-004" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl><Textarea placeholder="Describe brevemente el producto..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="category" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Categoría</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar categoría..." /></SelectTrigger></FormControl>
                              <SelectContent>{categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                          </Select>
                          <FormMessage />
                      </FormItem>
                  )} />
                  <FormField control={form.control} name="area" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Área</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar área..." /></SelectTrigger></FormControl>
                              <SelectContent>{userAreas.map(area => <SelectItem key={area} value={area}>{area}</SelectItem>)}</SelectContent>
                          </Select>
                          <FormMessage />
                      </FormItem>
                  )} />
              </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {(watchedCategory === 'Agroquímicos' || watchedCategory === 'Fertilizantes') && (
                   <FormField control={form.control} name="cultivo" render={({ field }) => (
                     <FormItem>
                       <FormLabel>Cultivo</FormLabel>
                       <Select onValueChange={field.onChange} value={field.value}>
                         <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar cultivo..." /></SelectTrigger></FormControl>
                         <SelectContent>{cultivos.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                       </Select>
                       <FormMessage />
                     </FormItem>
                   )} />
                 )}
                  <FormField control={form.control} name="location" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Ubicación</FormLabel>
                          <FormControl><Input placeholder="Ej: Almacén A, Estante 5" {...field} /></FormControl>
                          <FormMessage />
                      </FormItem>
                   )} />
                 <FormField control={form.control} name="unit" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidad de Medida</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                         <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar unidad..." /></SelectTrigger></FormControl>
                         <SelectContent>{units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
               </div>
              
              <h4 className="text-lg font-semibold border-b pb-2 pt-4">Archivos Adjuntos</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="images" render={({ field: { onChange, value, ...rest } }) => (
                        <FormItem>
                            <FormLabel>Imágenes del Producto</FormLabel>
                            <FormControl>
                                <Input type="file" multiple accept="image/*" onChange={(e) => onChange(e.target.files)} {...rest} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="technicalSheet" render={({ field: { onChange, value, ...rest } }) => (
                         <FormItem>
                            <FormLabel>Ficha Técnica (PDF)</FormLabel>
                            <FormControl>
                                <Input type="file" accept=".pdf" onChange={(e) => onChange(e.target.files)} {...rest} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

              <h4 className="text-lg font-semibold border-b pb-2 pt-4">Información del Lote Inicial</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="loteId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID del Lote</FormLabel>
                    <FormControl><Input placeholder="Ej: LOTE-2024-01" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="stock" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad Inicial</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
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
            </form>
          </Form>
        </div>
        <DialogFooter className="p-6 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="submit" form="product-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear Producto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
