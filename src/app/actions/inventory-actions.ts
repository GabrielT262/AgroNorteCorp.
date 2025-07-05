'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import type { InventoryItem } from '@/lib/types';
import { eq } from 'drizzle-orm';


export async function deleteProductAction(id: string) {
  try {
    await db.delete(schema.inventoryItems).where(eq(schema.inventoryItems.id, id));
    revalidatePath('/dashboard/inventory');
    return { success: true };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { success: false, message: 'Error al eliminar el producto.' };
  }
}

export async function createOrUpdateProductAction(productData: InventoryItem, isEditing: boolean) {
    try {
        const dataToSave = {
            ...productData,
            expiryDate: productData.expiryDate ? productData.expiryDate : null,
        }

        if (isEditing) {
            await db.update(schema.inventoryItems)
                .set(dataToSave)
                .where(eq(schema.inventoryItems.id, productData.id));
        } else {
            await db.insert(schema.inventoryItems).values(dataToSave);
        }
        revalidatePath('/dashboard/inventory');
        return { success: true };
    } catch (error) {
        console.error('Error saving product:', error);
        return { success: false, message: 'Error al guardar el producto.' };
    }
}
