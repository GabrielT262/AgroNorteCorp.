
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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { summarizeOrders } from "@/ai/flows/summarize-orders";
import type { InventoryCultivo, UserArea, RecentOrder } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Bot, Loader2, Minus, Plus } from "lucide-react";
import { useOrder } from "@/context/order-context";
import { createOrderAction } from "@/app/actions/order-actions";

// Hardcoded current user for demo purposes. In a real app, this would come from an auth context.
const currentUser = { 
  name: 'Gabriel T', 
  area: 'Administrador' as UserArea,
  signatureUrl: 'https://placehold.co/200x80.png?text=Firma+GT'
};

export function OrderSheet() {
  const { 
    orderItems, 
    removeItem, 
    updateItemQuantity,
    updateItemUsageDescription,
    clearOrder,
    isSheetOpen, 
    setSheetOpen 
  } = useOrder();
  
  const [costCenter, setCostCenter] = React.useState("");
  const [cultivo, setCultivo] = React.useState<InventoryCultivo | undefined>();
  const [observations, setObservations] = React.useState("");

  const [summary, setSummary] = React.useState("");
  const [isAiLoading, startAiTransition] = React.useTransition();
  const [isSubmitting, startSubmitTransition] = React.useTransition();
  const { toast } = useToast();

  const cultivos: InventoryCultivo[] = ['Uva', 'Palto'];
  const showCultivo = orderItems.some(item => item.category === 'Agroquímicos' || item.category === 'Fertilizantes');

  const handleGenerateSummary = () => {
    if (orderItems.length === 0) {
        toast({ title: "Error", description: "Añade al menos un artículo para generar un resumen.", variant: "destructive" });
        return;
    }

    startAiTransition(async () => {
      const input = {
        orderItems: orderItems.map(item => ({ item: item.name, quantity: item.quantity }))
      };
      try {
        const result = await summarizeOrders(input);
        setSummary(result.summary);
      } catch (error) {
        console.error(error);
        toast({ title: "Error de IA", description: "No se pudo generar el resumen.", variant: "destructive" });
      }
    });
  };

  const handleSubmitOrder = () => {
    if (orderItems.length === 0) {
      toast({ title: "Error", description: "Tu lista de pedidos está vacía.", variant: "destructive" });
      return;
    }
    if (!costCenter) {
      toast({ title: "Faltan datos", description: "Por favor, completa el campo de Centro de Costos.", variant: "destructive" });
      return;
    }
     if (showCultivo && !cultivo) {
      toast({ title: "Faltan datos", description: "Debes seleccionar un cultivo.", variant: "destructive" });
      return;
    }

    const orderData: Omit<RecentOrder, 'id' | 'date' | 'status'> = {
        items: orderItems,
        requestingArea: currentUser.area,
        requestingUserName: currentUser.name,
        requestingUserSignatureUrl: currentUser.signatureUrl,
        costCenter,
        cultivo,
        observations
    };

    startSubmitTransition(async () => {
        const result = await createOrderAction(orderData);

        if (result.success) {
            toast({
              title: "Solicitud Enviada",
              description: `Tu pedido ${result.orderId} ha sido enviado para su aprobación.`,
            });
            
            clearOrder();
            setCostCenter("");
            setCultivo(undefined);
            setObservations("");
            setSummary("");
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

  const resetSheet = () => {
    setCostCenter("");
    setCultivo(undefined);
    setObservations("");
    setSummary("");
  }
  
  const isSubmitDisabled = orderItems.length === 0 || !costCenter || (showCultivo && !cultivo);
  
  return (
    <Sheet open={isSheetOpen} onOpenChange={(open) => {
        if(!open) resetSheet();
        setSheetOpen(open);
    }}>
      <SheetContent className="sm:max-w-lg w-full flex flex-col p-0">
        <SheetHeader className="p-6">
          <SheetTitle className="font-headline text-2xl">Mi Solicitud de Pedido</SheetTitle>
          <SheetDescription>
            Revisa los artículos y completa el formulario para enviar tu solicitud.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 space-y-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Artículos del Pedido ({orderItems.length})</h3>
              {orderItems.length > 0 ? (
                  <div className="space-y-4 max-h-56 pr-2">
                      {orderItems.map(item => (
                          <div key={item.itemId} className="flex flex-col gap-3 p-3 rounded-lg border bg-secondary/50">
                            <div className="flex items-start justify-between">
                              <div>
                                  <p className="font-medium leading-tight">{item.name}</p>
                                  <div className="flex items-center gap-2 mt-2">
                                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateItemQuantity(item.itemId, item.quantity - 1)}><Minus className="h-4 w-4" /></Button>
                                      <Input className="h-7 w-14 text-center" type="number" value={item.quantity || ''} onChange={(e) => updateItemQuantity(item.itemId, parseFloat(e.target.value) || 0)}/>
                                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateItemQuantity(item.itemId, item.quantity + 1)}><Plus className="h-4 w-4" /></Button>
                                  </div>
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => removeItem(item.itemId)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor={`usage-desc-${item.itemId}`} className="text-xs">Descripción de Uso (Opcional)</Label>
                                <Textarea 
                                    id={`usage-desc-${item.itemId}`}
                                    placeholder="Indica brevemente para qué necesitas este producto..."
                                    className="min-h-[40px] text-sm"
                                    value={item.usageDescription || ''}
                                    onChange={(e) => updateItemUsageDescription(item.itemId, e.target.value)}
                                />
                            </div>
                          </div>
                      ))}
                  </div>
              ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Añade productos desde la pestaña de inventario.</p>
              )}
            </div>
            
            <Separator />
            
            <div className="space-y-4">
                 <h3 className="font-semibold text-lg">Detalles de la Solicitud</h3>
                 <div className="space-y-2">
                    <Label htmlFor="area">Área</Label>
                    <Input id="area" value={currentUser.area} disabled />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="cost-center">Centro de Costos</Label>
                    <Input id="cost-center" value={costCenter} onChange={e => setCostCenter(e.target.value)} placeholder="Ej: CC-PALTO-01"/>
                 </div>
                 {showCultivo && (
                     <div className="space-y-2">
                        <Label htmlFor="cultivo">Cultivo</Label>
                        <Select value={cultivo} onValueChange={(v) => setCultivo(v as InventoryCultivo)}>
                            <SelectTrigger id="cultivo"><SelectValue placeholder="Seleccionar cultivo..." /></SelectTrigger>
                            <SelectContent>
                                {cultivos.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                            </SelectContent>
                        </Select>
                     </div>
                 )}
                 <div className="space-y-2">
                    <Label htmlFor="observations">Observaciones Generales</Label>
                    <Textarea id="observations" value={observations} onChange={e => setObservations(e.target.value)} placeholder="Ej: Urgente, se necesita para mañana"/>
                 </div>
            </div>
            
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg flex items-center gap-2"><Bot className="h-5 w-5 text-primary"/> Resumen Inteligente</h3>
                  <Button variant="outline" size="sm" onClick={handleGenerateSummary} disabled={isAiLoading || orderItems.length === 0}>
                      {isAiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generar"}
                  </Button>
              </div>
              <Textarea
                value={summary}
                readOnly
                placeholder="Haz clic en 'Generar' para crear un resumen de tu pedido con IA."
                className="min-h-[120px] bg-muted/50 focus-visible:ring-primary"
              />
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
