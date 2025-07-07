

"use client";

import * as React from "react";
import Image from 'next/image';
import type { InventoryItem } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Tag, Sprout, Calendar, Building2, FileText, Package } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface ProductDetailDialogProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductDetailDialog({ item, isOpen, onOpenChange }: ProductDetailDialogProps) {
  if (!item) return null;

  const totalStock = item.batches.reduce((sum, batch) => sum + batch.stock, 0);
  const status = totalStock <= 0 ? 'Agotado' : totalStock <= 10 ? 'Poco Stock' : 'En Stock';
  
  const statusVariant = {
    "En Stock": "default",
    "Poco Stock": "secondary",
    "Agotado": "destructive",
  } as const;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-headline">{item.name}</DialogTitle>
          <DialogDescription>{item.id}</DialogDescription>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-8 py-4">
          <div className="flex flex-col items-center">
             <div className="w-full max-w-xs p-1">
                <div className="aspect-square relative bg-muted rounded-lg overflow-hidden">
                <Image
                    src={item.images?.[0] || 'https://placehold.co/600x600.png'}
                    alt={`${item.name}`}
                    fill
                    className="object-cover"
                    data-ai-hint={item.ai_hint}
                />
                </div>
             </div>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Descripción</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-2">
                    <Tag className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                        <p className="font-medium">Categoría</p>
                        <p className="text-muted-foreground">{item.category}</p>
                    </div>
                </div>
                 <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                        <p className="font-medium">Área</p>
                        <p className="text-muted-foreground">{item.area}</p>
                    </div>
                </div>
                <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                        <p className="font-medium">Ubicación</p>
                        <p className="text-muted-foreground">{item.location}</p>
                    </div>
                </div>
                {item.cultivo && (
                    <div className="flex items-start gap-2">
                        <Sprout className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                            <p className="font-medium">Cultivo</p>
                            <p className="text-muted-foreground">{item.cultivo}</p>
                        </div>
                    </div>
                )}
                 <div className="flex items-start gap-2 col-span-2">
                    <p className="font-medium pt-0.5">Estado General:</p>
                    <Badge variant={statusVariant[status]}>{status} ({totalStock} {item.unit})</Badge>
                 </div>
            </div>
            <Separator />
             <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><Package className="h-5 w-5"/> Desglose de Lotes</h3>
              <ScrollArea className="h-40 w-full rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID Lote</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Vencimiento</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {item.batches.map(batch => (
                            <TableRow key={batch.id}>
                                <TableCell className="font-medium">{batch.id}</TableCell>
                                <TableCell>{batch.stock} {item.unit}</TableCell>
                                <TableCell>
                                    {batch.expiry_date 
                                        ? format(parseISO(batch.expiry_date), "dd/MM/yyyy", { locale: es })
                                        : '-'}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
