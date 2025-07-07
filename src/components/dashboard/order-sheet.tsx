"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { InventoryCultivo, UserArea, RecentOrder } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Loader2, Minus, Plus } from "lucide-react";
import { useOrder } from "@/context/order-context";
import { createOrderAction } from "@/app/actions/order-actions";

// Hardcoded current user for demo purposes. In a real app, this would come from an auth context.
const currentUser = { 
  id: 'usr_gabriel',
  name: 'Gabriel T', 
  area: 'Administrador' as UserArea,
};

export function OrderSheet() {
  const { 
    orderItems, 
    removeItem, 
    updateItemQuantity,
    updateItemDetails,
    clearOrder,
    isSheetOpen, 
    setSheetOpen 
  } = useOrder();
  
  const [isSubmitting, startSubmitTransition] = React.useTransition();
  const { toast } = useToast();

  const userAreas: UserArea[] = ['Gerencia', 'Logística', 'RR.HH', 'Seguridad Patrimonial', 'Almacén', 'Taller', 'Producción', 'Sanidad', 'SS.GG'];
  const cultivos: InventoryCultivo[] = ['Uva', 'Palto'];

  const handleSubmitOrder = () => {
    if (orderItems.length === 0) {
      toast({ title: "Error", description: "Tu lista de pedidos está vacía.", variant: "destructive" });
      return;
    }

    for (const item of orderItems) {
        if (!item.cost_center) {
            toast({ title: "Faltan datos", description: `Por favor, completa el Centro de Costos para "${item.name}".`, variant: "destructive" });
            return;
        }
        if ((item.category === 'Agroquímicos' || item.category === 'Fertilizantes') && !item.cultivo) {
            toast({ title: "Faltan datos", description: `Debes seleccionar un Cultivo/Lote para "${item.name}".`, variant: "destructive" });
            return;
        }
    }

    const orderData: Omit<RecentOrder, 'id' | 'date' | 'status' | 'users'> = {
        items: orderItems,
        requesting_area: currentUser.area,
        requesting_user_id: currentUser.id,
    };

    startSubmitTransition(async () => {
        const result = await createOrderAction(orderData);

        if (result.success) {
            toast({
              title: "Solicitud Enviada",
              description: `Tu pedido ${result.orderId} ha sido enviado para su aprobación.`,
            });
            
            clearOrder();
            setSheetOpen(false);
        } else {
            toast({
                title: "Error al Enviar",
                description: result.message || "No se pudo crear la solicitud.",
                variant: "destructive",
            });
        }
    });
  };
  
  const isSubmitDisabled = orderItems.length === 0 || orderItems.some(item => !item.cost_center || ((item.category === 'Agroquímicos' || item.category === 'Fertilizantes') && !item.cultivo));
  
  return (
    <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
      <SheetContent className="sm:max-w-lg w-full flex flex-col p-0">
        <SheetHeader className="p-6">
          <SheetTitle className="font-headline text-2xl">Mi Solicitud de Pedido</SheetTitle>
          <SheetDescription>
            Revisa los artículos y completa el formulario para enviar tu solicitud.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 space-y-6 pb-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Artículos del Pedido ({orderItems.length})</h3>
              {orderItems.length > 0 ? (
                  <div className="space-y-4 pr-2">
                      {orderItems.map(item => (
                          <div key={item.item_id} className="flex flex-col gap-3 p-3 rounded-lg border bg-background">
                            <div className="flex items-start justify-between">
                              <div>
                                  <p className="font-medium leading-tight">{item.name}</p>
                                  <div className="flex items-center gap-2 mt-2">
                                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateItemQuantity(item.item_id, item.quantity - 1)}><Minus className="h-4 w-4" /></Button>
                                      <Input className="h-7 w-14 text-center" type="number" value={item.quantity || ''} onChange={(e) => updateItemQuantity(item.item_id, parseFloat(e.target.value) || 0)}/>
                                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateItemQuantity(item.item_id, item.quantity + 1)}><Plus className="h-4 w-4" /></Button>
                                  </div>
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => removeItem(item.item_id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>

                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label htmlFor={`area-${item.item_id}`} className="text-xs">Área Destino (Opcional)</Label>
                                    <Select onValueChange={(v) => updateItemDetails(item.item_id, { area: v as UserArea })} value={item.area}>
                                        <SelectTrigger id={`area-${item.item_id}`} className="h-8 text-xs"><SelectValue placeholder="Misma área solicitante" /></SelectTrigger>
                                        <SelectContent>{userAreas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor={`cost-center-${item.item_id}`} className="text-xs">Centro de Costos</Label>
                                    <Input id={`cost-center-${item.item_id}`} value={item.cost_center || ''} onChange={(e) => updateItemDetails(item.item_id, { cost_center: e.target.value })} placeholder="Ej: CC-PALTO-01" className="h-8 text-xs"/>
                                </div>
                                {(item.category === 'Agroquímicos' || item.category === 'Fertilizantes') && (
                                    <div className="space-y-1">
                                        <Label htmlFor={`cultivo-${item.item_id}`} className="text-xs">Cultivo/Lote</Label>
                                        <Select onValueChange={(v) => updateItemDetails(item.item_id, { cultivo: v as InventoryCultivo })} value={item.cultivo}>
                                            <SelectTrigger id={`cultivo-${item.item_id}`} className="h-8 text-xs"><SelectValue placeholder="Seleccionar cultivo..." /></SelectTrigger>
                                            <SelectContent>{cultivos.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))} </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <Label htmlFor={`observations-${item.item_id}`} className="text-xs">Observaciones</Label>
                                    <Textarea 
                                        id={`observations-${item.item_id}`}
                                        placeholder="Indica brevemente para qué necesitas este producto..."
                                        className="min-h-[40px] text-xs"
                                        value={item.observations || ''}
                                        onChange={(e) => updateItemDetails(item.item_id, { observations: e.target.value })}
                                    />
                                </div>
                            </div>
                          </div>
                      ))}
                  </div>
              ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Añade productos desde la pestaña de inventario.</p>
              )}
            </div>
          </div>
        </ScrollArea>
        
        <SheetFooter className="mt-auto p-6 bg-background border-t">
          <Button variant="outline" onClick={() => setSheetOpen(false)} className="w-full sm:w-auto">Cancelar</Button>
          <Button onClick={handleSubmitOrder} className="w-full sm:w-auto" disabled={isSubmitDisabled || isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Enviar Solicitud'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
