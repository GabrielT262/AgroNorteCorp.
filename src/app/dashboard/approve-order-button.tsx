'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { approveOrderAction } from '../actions/order-actions';
import type { RecentOrder } from '@/lib/types';

export function ApproveOrderButton({ order }: { order: RecentOrder }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approveOrderAction(order);
      if (result.success) {
        toast({
          title: 'Pedido Aprobado',
          description: `El pedido ${order.id} ha sido aprobado.`,
        });
      } else {
        toast({
          title: 'Error',
          description: result.message || 'No se pudo aprobar el pedido.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Button size="sm" onClick={handleApprove} disabled={isPending}>
      {isPending ? 'Aprobando...' : 'Aprobar'}
    </Button>
  );
}
