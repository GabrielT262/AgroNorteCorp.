'use server';

import { revalidatePath } from 'next/cache';
import { deleteInventoryItem } from '@/lib/db';

/**
 * Server Action para eliminar un producto.
 * Esta función se ejecuta de forma segura en el servidor.
 * @param id - El SKU del producto a eliminar.
 */
export async function deleteProductAction(id: string) {
  const result = await deleteInventoryItem(id);

  if (result.success) {
    // Si la eliminación fue exitosa, Next.js revalidará la ruta de inventario.
    // Esto hace que la página se actualice con los datos más recientes la próxima vez que se visite.
    revalidatePath('/dashboard/inventory');
  }

  return result;
}
