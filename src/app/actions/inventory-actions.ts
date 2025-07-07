
'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import type { InventoryItem, InventoryHistoryEntry, Batch } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

async function uploadFileAndGetUrl(file: File, bucket: string, path: string): Promise<string | null> {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: '3600',
        upsert: true,
    });
    if (error) {
        console.error(`Error uploading to ${bucket}:`, error);
        return null;
    }
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
    return publicUrl;
}

export async function deleteProductAction(id: string) {
  try {
    const { error } = await supabase.from('inventory_items').delete().eq('id', id);
    if(error) throw error;

    revalidatePath('/dashboard/inventory');
    return { success: true };

  } catch (error) {
    console.error('Error deleting product:', error);
    return { success: false, message: 'Error al eliminar el producto.' };
  }
}

export async function createProductAction(productData: Omit<InventoryItem, 'batches' | 'images' | 'technical_sheet_url'>, initialBatch: Batch, formData: FormData) {
    const hardcodedUserId = 'usr_gabriel'; // Placeholder
    try {
        const { data: existingProduct } = await supabase.from('inventory_items').select('id').eq('id', productData.id).single();
        if (existingProduct) {
            return { success: false, message: 'Ya existe un producto con este SKU.' };
        }

        const images = formData.getAll('images') as File[];
        const technicalSheet = formData.get('technicalSheet') as File;
        
        const imageUrls: string[] = [];
        for (const image of images) {
            if (image.size > 0) {
                const imagePath = `public/${productData.id}-${image.name}-${Date.now()}`;
                const url = await uploadFileAndGetUrl(image, 'products', imagePath);
                if (url) imageUrls.push(url);
            }
        }
        
        let technical_sheet_url: string | undefined = undefined;
        if (technicalSheet && technicalSheet.size > 0) {
            const sheetPath = `public/${productData.id}-sheet-${Date.now()}`;
            const url = await uploadFileAndGetUrl(technicalSheet, 'products', sheetPath);
            if (url) technical_sheet_url = url;
        }

        const newProduct: InventoryItem = {
            ...productData,
            images: imageUrls,
            technical_sheet_url: technical_sheet_url,
            batches: [initialBatch],
        };

        const { error: productError } = await supabase.from('inventory_items').insert(newProduct);
        if (productError) throw productError;
        
        const historyEntry: Omit<InventoryHistoryEntry, 'id' | 'users'> = {
            date: new Date().toISOString(),
            product_id: newProduct.id,
            product_name: newProduct.name,
            type: 'Entrada',
            quantity: initialBatch.stock,
            unit: newProduct.unit,
            requesting_area: 'Almacén',
            user_id: hardcodedUserId,
            lote_id: initialBatch.id,
        };
        
        const { error: historyError } = await supabase.from('inventory_history').insert({ id: `HIST-${uuidv4()}`, ...historyEntry });
        if(historyError) throw historyError;

        revalidatePath('/dashboard/inventory');
        return { success: true };
    } catch (error) {
        console.error('Error creating product:', error);
        return { success: false, message: 'Error al crear el producto.' };
    }
}

export async function addStockAction(data: { productId: string; loteId: string; quantity: number; expiryDate?: string; }) {
    const hardcodedUserId = 'usr_gabriel'; // Placeholder
    try {
        const { data: product, error: fetchError } = await supabase
            .from('inventory_items')
            .select('id, name, unit, batches')
            .eq('id', data.productId)
            .single();

        if (fetchError || !product) {
            return { success: false, message: 'Producto no encontrado.' };
        }

        const existingLote = product.batches.find((b: Batch) => b.id.toLowerCase() === data.loteId.toLowerCase());
        if (existingLote) {
            return { success: false, message: `El lote ID "${data.loteId}" ya existe para este producto.` };
        }

        const newBatch: Batch = {
            id: data.loteId,
            stock: data.quantity,
            expiry_date: data.expiryDate,
        };
        
        const updatedBatches = [...product.batches, newBatch];
        
        const { error: updateError } = await supabase
            .from('inventory_items')
            .update({ batches: updatedBatches })
            .eq('id', data.productId);
            
        if(updateError) throw updateError;


        const historyEntry: Omit<InventoryHistoryEntry, 'id' | 'users'> = {
            date: new Date().toISOString(),
            product_id: product.id,
            product_name: product.name,
            type: 'Entrada',
            quantity: data.quantity,
            unit: product.unit,
            requesting_area: 'Almacén',
            user_id: hardcodedUserId,
            lote_id: data.loteId,
        };
        const { error: historyError } = await supabase.from('inventory_history').insert({ id: `HIST-${uuidv4()}`, ...historyEntry});
        if(historyError) throw historyError;


        revalidatePath('/dashboard/inventory');
        return { success: true };

    } catch (error) {
        console.error('Error adding stock:', error);
        return { success: false, message: 'Error al añadir stock.' };
    }
}
