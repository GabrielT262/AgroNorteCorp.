
'use client';

import * as React from 'react';
import type { RecentOrder } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { DispatchReceipt } from './dispatch-receipt';
import { Printer } from 'lucide-react';

interface PrintReceiptDialogProps {
  order: RecentOrder | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrintReceiptDialog({ order, isOpen, onOpenChange }: PrintReceiptDialogProps) {
  const handlePrint = () => {
    // We can't use window.print() in this environment, but this is where you'd trigger it.
    // For now, we'll just log to console to show it's working.
    console.log("Printing receipt for order:", order?.id);
    const printContents = document.getElementById('printable-receipt-area')?.innerHTML;
    const originalContents = document.body.innerHTML;
    if (printContents) {
      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      // We need to reload to restore event listeners etc.
      window.location.reload();
    }
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Vale de Despacho</DialogTitle>
          <DialogDescription>
            Revisa el vale y procede a imprimir. Se generará una copia para el solicitante y una para almacén.
          </DialogDescription>
        </DialogHeader>
        
        <div id="printable-receipt-area" className="max-h-[65vh] overflow-y-auto p-2 bg-white rounded-md">
           <DispatchReceipt order={order} />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
