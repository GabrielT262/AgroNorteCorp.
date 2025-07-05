'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import type { RecentOrder, OrderItem, UserArea } from '@/lib/types';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// This is a placeholder for a real notification system
async function addNotification(notification: { title: string, description: string, recipientArea: UserArea | 'Gerencia', path?: string }) {
    console.log('NOTIFICACION:', notification);
    // In a real app, you would insert this into a notifications table in the database.
}

export async function createOrderAction(orderData: Omit<RecentOrder, 'id' | 'date' | 'status'>) {
  const newOrderId = `ORD-${uuidv4().slice(0, 8).toUpperCase()}`;
  try {
    await db.insert(schema.orders).values({
      id: newOrderId,
      status: 'Pendiente',
      ...orderData,
      date: new Date(),
    });

    if (orderData.items.length > 0) {
        await db.insert(schema.orderItems).values(orderData.items.map(item => ({
            id: `ITEM-${uuidv4()}`,
            orderId: newOrderId,
            itemId: item.itemId,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            usageDescription: item.usageDescription,
        })));
    }
    
    await addNotification({
        title: 'Nueva Solicitud de Pedido',
        description: `Se ha creado una nueva solicitud (${newOrderId}). Revisar y aprobar.`,
        recipientArea: 'Gerencia'
    });

    revalidatePath('/dashboard/requests');
    revalidatePath('/dashboard');
    return { success: true, orderId: newOrderId };

  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false, message: 'Error de base de datos al crear el pedido.' };
  }
}

export async function approveOrderAction(order: RecentOrder) {
  try {
    await db.update(schema.orders)
      .set({ status: 'Aprobado' })
      .where(eq(schema.orders.id, order.id));

    await addNotification({
        title: 'Pedido Aprobado para Despacho',
        description: `El pedido ${order.id} está listo para ser despachado.`,
        recipientArea: 'Almacén',
        path: '/dashboard/requests'
    });
    await addNotification({
        title: `Tu Pedido ${order.id} Fue Aprobado`,
        description: 'Tu pedido ha sido aprobado y será preparado por almacén.',
        recipientArea: order.requestingArea,
        path: '/dashboard/requests'
    });
    
    revalidatePath('/dashboard/requests');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error approving order:', error);
    return { success: false, message: 'Error de base de datos.' };
  }
}

export async function rejectOrderAction(orderId: string, recipientArea: UserArea) {
    try {
        await db.update(schema.orders)
            .set({ status: 'Rechazado' })
            .where(eq(schema.orders.id, orderId));
        
        await addNotification({
            title: `Tu Pedido ${orderId} Fue Rechazado`,
            description: 'Ponte en contacto con Gerencia para más detalles.',
            recipientArea: recipientArea,
            path: '/dashboard/requests'
        });
        
        revalidatePath('/dashboard/requests');
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error('Error rejecting order:', error);
        return { success: false, message: 'Error de base de datos.' };
    }
}

export async function dispatchOrderAction(order: RecentOrder) {
    try {
        await db.update(schema.orders)
            .set({ status: 'Despachado' })
            .where(eq(schema.orders.id, order.id));
        
        await addNotification({
            title: `Tu Pedido ${order.id} ha sido Despachado`,
            description: 'Los productos de tu solicitud ya han salido del almacén.',
            recipientArea: order.requestingArea,
            path: '/dashboard/requests'
        });
        
        revalidatePath('/dashboard/requests');
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error('Error dispatching order:', error);
        return { success: false, message: 'Error de base de datos.' };
    }
}
