
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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileText, Truck, MapPin, Tag, Sprout, Calendar, Building2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface ProductDetailDialogProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductDetailDialog({ item, isOpen, onOpenChange }: ProductDetailDialogProps) {
  if (!item) return null;

  const statusVariant = {
    "En Stock": "default",
    "Poco Stock": "secondary",
    "Agotado": "destructive",
  } as const;
  
  const allImages = item.images && item.images.length > 0 ? item.images : ['https://placehold.co/600x600.png'];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-headline">{item.name}</DialogTitle>
          <DialogDescription>{item.id}</DialogDescription>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-8 py-4">
          <div className="flex flex-col items-center">
             <Carousel className="w-full max-w-xs">
              <CarouselContent>
                {allImages.map((src, index) => (
                  <CarouselItem key={index}>
                    <div className="p-1">
                       <div className="aspect-square relative bg-muted rounded-lg overflow-hidden">
                        <Image
                            src={src}
                            alt={`${item.name} - foto ${index + 1}`}
                            fill
                            className="object-cover"
                            data-ai-hint={item.aiHint}
                        />
                       </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
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
                {item.expiryDate && (
                    <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                            <p className="font-medium">Vencimiento</p>
                            <p className="text-muted-foreground">{format(parseISO(item.expiryDate), "PPP", { locale: es })}</p>
                        </div>
                    </div>
                )}
                 <div className="flex items-start gap-2">
                    <p className="font-medium pt-0.5">Estado:</p>
                    <Badge variant={statusVariant[item.status]}>{item.status}</Badge>
                 </div>
            </div>

            <Separator />
            
            <div className="flex gap-2">
              <Button asChild variant="outline" disabled={!item.technicalSheetUrl}>
                <a href={item.technicalSheetUrl} target="_blank" rel="noopener noreferrer">
                    <FileText className="mr-2" />
                    Ficha Técnica
                </a>
              </Button>
              <Button asChild variant="outline" disabled={!item.remissionGuideUrl}>
                <a href={item.remissionGuideUrl} target="_blank" rel="noopener noreferrer">
                    <Truck className="mr-2" />
                    Guía de Remisión
                </a>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
