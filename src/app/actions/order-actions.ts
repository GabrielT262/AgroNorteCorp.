
'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import type { RecentOrder, UserArea, InventoryHistoryEntry, Batch, InventoryItem } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { createNotificationAction } from './notification-actions';

export async function createOrderAction(orderData: Omit<RecentOrder, 'id' | 'date' | 'status' | 'users'>) {
  const newOrderId = `ORD-${uuidv4().slice(0, 8).toUpperCase()}`;
  try {
    const newOrder: Omit<RecentOrder, 'id' | 'users'> = {
      status: 'Pendiente',
      ...orderData,
      date: new Date().toISOString(),
    };

    const { error } = await supabase.from('orders').insert({ id: newOrderId, ...newOrder });
    if(error) throw error;
    
    await createNotificationAction({
        title: 'Nueva Solicitud de Pedido',
        description: `El área de ${orderData.requesting_area} ha creado la solicitud ${newOrderId}.`,
        recipient_id: 'Gerencia',
        path: '/dashboard/requests'
    });

    revalidatePath('/dashboard/requests');
    revalidatePath('/dashboard');
    return { success: true, orderId: newOrderId };

  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false, message: 'Error al crear el pedido.' };
  }
}

export async function approveOrderAction(order: RecentOrder) {
  try {
    const { error } = await supabase.from('orders').update({ status: 'Aprobado' }).eq('id', order.id);
    if(error) throw error;

    await createNotificationAction({
        title: 'Pedido Aprobado para Despacho',
        description: `El pedido ${order.id} está listo para ser despachado.`,
        recipient_id: 'Almacén',
        path: '/dashboard/requests'
    });
    await createNotificationAction({
        title: `Tu Pedido ${order.id} Fue Aprobado`,
        description: 'Tu pedido ha sido aprobado y será preparado por almacén.',
        recipient_id: order.requesting_area,
        path: '/dashboard/requests'
    });
    
    revalidatePath('/dashboard/requests');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error approving order:', error);
    return { success: false, message: 'Error en la acción.' };
  }
}

export async function rejectOrderAction(orderId: string, recipientArea: UserArea) {
    try {
        const { error } = await supabase.from('orders').update({ status: 'Rechazado' }).eq('id', orderId);
        if(error) throw error;
        
        await createNotificationAction({
            title: `Tu Pedido ${orderId} Fue Rechazado`,
            description: 'Ponte en contacto con Gerencia para más detalles.',
            recipient_id: recipientArea,
            path: '/dashboard/requests'
        });
        
        revalidatePath('/dashboard/requests');
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error('Error rejecting order:', error);
        return { success: false, message: 'Error en la acción.' };
    }
}

export async function dispatchOrderAction(order: RecentOrder) {
    try {
        // Fetch all inventory items needed for the order in one go
        const itemIds = order.items.map(item => item.item_id);
        const { data: inventoryItems, error: fetchError } = await supabase
            .from('inventory_items')
            .select('id, name, batches')
            .in('id', itemIds);

        if (fetchError) throw fetchError;
        
        // Check if all items can be dispatched
        for (const item of order.items) {
            const inventoryItem = inventoryItems.find(invItem => invItem.id === item.item_id);
            const totalStock = inventoryItem?.batches.reduce((sum, batch) => sum + batch.stock, 0) || 0;
            if (!inventoryItem || totalStock < item.quantity) {
                return { success: false, message: `Stock insuficiente para "${item.name}". Stock actual: ${totalStock}.` };
            }
        }
        
        const inventoryUpdates = [];
        const historyInserts: Omit<InventoryHistoryEntry, 'id' | 'users'>[] = [];

        // All items have enough stock, proceed with dispatch logic
        for (const item of order.items) {
            const inventoryItem = inventoryItems.find(invItem => invItem.id === item.item_id);
            if(inventoryItem) {
                let quantityToDispatch = item.quantity;

                const sortedBatches = [...inventoryItem.batches].sort((a, b) => {
                    if (a.expiry_date && b.expiry_date) return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
                    if (a.expiry_date) return -1;
                    if (b.expiry_date) return 1;
                    return 0;
                });

                for (const batch of sortedBatches) {
                    if (quantityToDispatch <= 0) break;
                    const stockToTake = Math.min(quantityToDispatch, batch.stock);
                    if (stockToTake > 0) {
                        batch.stock -= stockToTake;
                        quantityToDispatch -= stockToTake;

                        historyInserts.push({
                            date: new Date().toISOString(),
                            product_id: item.item_id,
                            product_name: item.name,
                            type: 'Salida',
                            quantity: stockToTake,
                            unit: item.unit,
                            requesting_area: order.requesting_area,
                            user_id: order.requesting_user_id,
                            order_id: order.id,
                            lote_id: batch.id,
                        });
                    }
                }
                inventoryUpdates.push({ id: inventoryItem.id, batches: sortedBatches });
            }
        }

        // Batch update inventory items
        const { error: updateError } = await supabase.from('inventory_items').upsert(inventoryUpdates);
        if (updateError) throw updateError;
        
        // Batch insert history
        const historyWithIds = historyInserts.map(h => ({ ...h, id: `HIST-OUT-${uuidv4().slice(0, 8)}`}));
        const { error: historyError } = await supabase.from('inventory_history').insert(historyWithIds);
        if(historyError) throw historyError;
        
        // Update order status
        const { error: orderError } = await supabase.from('orders').update({ status: 'Despachado' }).eq('id', order.id);
        if(orderError) throw orderError;
        
        await createNotificationAction({
            title: `Tu Pedido ${order.id} ha sido Despachado`,
            description: 'Los productos de tu solicitud ya han salido del almacén.',
            recipient_id: order.requesting_area,
            path: '/dashboard/requests'
        });
        
        revalidatePath('/dashboard/requests');
        revalidatePath('/dashboard');
        revalidatePath('/dashboard/inventory');
        return { success: true };
    } catch (error) {
        console.error('Error dispatching order:', error);
        return { success: false, message: 'Error en la acción de despacho.' };
    }
}
