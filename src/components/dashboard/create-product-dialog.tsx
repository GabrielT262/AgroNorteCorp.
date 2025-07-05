
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

import { cn } from "@/lib/utils";
import type { InventoryCategory, InventoryUnit, InventoryCultivo, InventoryItem, UserArea } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, Upload, X, Paperclip } from "lucide-react";

const categories: InventoryCategory[] = ["Herramientas", "Repuestos", "Fertilizantes", "Agroquímicos", "Varios", "Implementos de Riego", "Implementos de SST"];
const units: InventoryUnit[] = ['Unidad', 'Kg', 'Litros', 'Metros'];
const cultivos: InventoryCultivo[] = ['Uva', 'Palto'];
const userAreas: UserArea[] = ['Gerencia', 'Logística', 'RR.HH', 'Seguridad Patrimonial', 'Almacén', 'Taller', 'Producción', 'Sanidad', 'SS.GG', 'Administrador'];


const productFormSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  sku: z.string().min(3, "El SKU debe tener al menos 3 caracteres."),
  description: z.string().optional(),
  expiryDate: z.date().optional(),
  location: z.string().min(3, "La ubicación es requerida."),
  category: z.enum(categories, { required_error: "Debes seleccionar una categoría." }),
  area: z.enum(userAreas, { required_error: "Debes seleccionar un área." }),
  cultivo: z.enum(cultivos).optional(),
  stock: z.coerce.number().min(0, "La cantidad no puede ser negativa."),
  unit: z.enum(units, { required_error: "Debes seleccionar una unidad." }),
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
  onSave: (product: InventoryItem) => void;
  initialData?: InventoryItem | null;
}

export function CreateProductDialog({ isOpen, onOpenChange, onSave, initialData }: CreateProductDialogProps) {
  const { toast } = useToast();
  const [photos, setPhotos] = React.useState<File[]>([]);
  const [techSheet, setTechSheet] = React.useState<File | null>(null);
  const [remissionGuide, setRemissionGuide] = React.useState<File | null>(null);

  const isEditMode = !!initialData;
  
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
  });

  React.useEffect(() => {
    if (isOpen) {
        if (isEditMode && initialData) {
            form.reset({
                ...initialData,
                expiryDate: initialData.expiryDate ? parseISO(initialData.expiryDate) : undefined,
            });
        } else {
            form.reset({ stock: 0, name: '', sku: '', description: '', location: '', category: undefined, unit: undefined, cultivo: undefined, area: undefined, expiryDate: undefined });
        }
    }
  }, [isOpen, isEditMode, initialData, form]);
  
  const watchedCategory = form.watch("category");

  function onSubmit(data: ProductFormValues) {
    if(!isEditMode && photos.length === 0) {
        toast({ title: "Error", description: "Debes subir al menos una foto.", variant: "destructive" });
        return;
    }

    const stock = data.stock || 0;
    const status = stock === 0 ? 'Agotado' : stock <= 10 ? 'Poco Stock' : 'En Stock';
    
    // In a real app, you would handle file uploads and get URLs.
    // For this prototype, we'll create the object with placeholder data.
    const productToSave: InventoryItem = {
      id: initialData?.id || data.sku,
      name: data.name,
      description: data.description || '',
      category: data.category,
      area: data.area,
      cultivo: data.cultivo,
      location: data.location,
      stock: stock,
      unit: data.unit,
      expiryDate: data.expiryDate ? format(data.expiryDate, 'yyyy-MM-dd') : undefined,
      status: status,
      images: initialData?.images || ['https://placehold.co/400x400.png'],
      aiHint: initialData?.aiHint || `${data.category} ${data.name}`,
      technicalSheetUrl: initialData?.technicalSheetUrl, // Placeholder
      remissionGuideUrl: initialData?.remissionGuideUrl, // Placeholder
    };
    
    onSave(productToSave);

    toast({
      title: isEditMode ? "Producto Actualizado" : "Producto Creado",
      description: `El producto "${data.name}" ha sido ${isEditMode ? 'actualizado' : 'añadido al inventario'}.`,
    });
    
    if (!isEditMode) {
        setPhotos([]);
        setTechSheet(null);
        setRemissionGuide(null);
    }
    onOpenChange(false);
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: (file: File | null) => void) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files);
      if (photos.length + newPhotos.length > 3) {
        toast({ title: "Límite de fotos", description: "Puedes subir un máximo de 3 fotos.", variant: "destructive" });
        return;
      }
      setPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  }


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl flex flex-col max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>{isEditMode ? "Editar Producto" : "Crear Nuevo Producto"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Actualiza los detalles del producto." : "Completa los detalles para añadir un nuevo producto al inventario."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1">
              <div className="space-y-6 px-6 py-4">
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
                      <FormLabel>SKU</FormLabel>
                      <FormControl><Input placeholder="Ej: AGRO-004" {...field} disabled={isEditMode} /></FormControl>
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
                 </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField control={form.control} name="expiryDate" render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Fecha de Vencimiento (Opcional)</FormLabel>
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
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="stock" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cantidad {isEditMode ? 'Actual' : 'Inicial'}</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
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

                <div className="space-y-4">
                    <div>
                        <Label>Fotos del Producto (min. 1, max. 3)</Label>
                        {isEditMode && <p className="text-xs text-muted-foreground">La edición de fotos no está disponible. Sube nuevos productos para nuevas imágenes.</p>}
                        <div className="mt-2 flex items-center gap-4">
                            <Button asChild variant="outline" size="sm" disabled={isEditMode}>
                                <Label className="cursor-pointer"><Upload className="mr-2 h-4 w-4" />Subir Fotos <Input type="file" className="sr-only" accept="image/*" multiple onChange={handlePhotoChange} disabled={photos.length >= 3 || isEditMode} /></Label>
                            </Button>
                            <div className="flex gap-2">
                                {photos.map((photo, index) => (
                                    <div key={index} className="relative">
                                        <img src={URL.createObjectURL(photo)} alt="preview" className="h-16 w-16 rounded-md object-cover"/>
                                        <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => removePhoto(index)}><X className="h-4 w-4" /></Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div>
                        <Label>Ficha Técnica (PDF, Opcional)</Label>
                         <Button asChild variant="outline" size="sm" className="w-full mt-2">
                            <Label className="cursor-pointer w-full flex justify-center"><Upload className="mr-2 h-4 w-4" />{techSheet ? 'Cambiar archivo' : 'Subir PDF'}<Input type="file" className="sr-only" accept=".pdf" onChange={(e) => handleFileChange(e, setTechSheet)} /></Label>
                        </Button>
                        {techSheet && <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2"><Paperclip className="h-4 w-4" /><span>{techSheet.name}</span></div>}
                    </div>
                     <div>
                        <Label>Guía de Remisión (PDF, Opcional)</Label>
                        <Button asChild variant="outline" size="sm" className="w-full mt-2">
                           <Label className="cursor-pointer w-full flex justify-center"><Upload className="mr-2 h-4 w-4" />{remissionGuide ? 'Cambiar archivo' : 'Subir Archivo'}<Input type="file" className="sr-only" accept=".pdf" onChange={(e) => handleFileChange(e, setRemissionGuide)} /></Label>
                        </Button>
                         {remissionGuide && <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2"><Paperclip className="h-4 w-4" /><span>{remissionGuide.name}</span></div>}
                    </div>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="p-6 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit">{isEditMode ? "Guardar Cambios" : "Crear Producto"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
