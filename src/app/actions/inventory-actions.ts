
'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import type { InventoryItem, InventoryHistoryEntry, Batch, InventoryCategory, InventoryUnit, UserArea, InventoryCultivo } from '@/lib/types';
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


export async function importInventoryAction(data: any[]) {
    const hardcodedUserId = 'usr_gabriel'; // Placeholder
    let created = 0;
    let updated = 0;
    let errors = 0;
    const errorMessages: string[] = [];
    const categories: InventoryCategory[] = ["Herramientas", "Repuestos", "Fertilizantes", "Agroquímicos", "Varios", "Implementos de Riego", "Implementos de SST"];
    const units: InventoryUnit[] = ['Unidad', 'Kg', 'Litros', 'Metros'];
    const userAreas: UserArea[] = ['Gerencia', 'Logística', 'RR.HH', 'Seguridad Patrimonial', 'Almacén', 'Taller', 'Producción', 'Sanidad', 'SS.GG', 'Administrador'];
    const cultivos: InventoryCultivo[] = ['Uva', 'Palto'];

    const { data: allProducts, error: fetchAllError } = await supabase.from('inventory_items').select('id, batches, name, unit');
    if (fetchAllError) {
        return { success: false, message: 'Error fetching existing products.' };
    }

    const productMap = new Map(allProducts.map(p => [p.id, p]));
    const inventoryUpdates: any[] = [];
    const historyInserts: any[] = [];

    for (const [index, row] of data.entries()) {
        const { sku, name, description, category, area, cultivo, location, unit, lote_id, stock, expiry_date } = row;
        
        const rowNum = index + 2;
        if (!sku || !name || !category || !area || !location || !unit || !lote_id || stock === undefined) {
            errors++;
            errorMessages.push(`Fila ${rowNum}: Faltan datos requeridos (sku, name, category, etc.).`);
            continue;
        }

        if (!categories.includes(category) || !units.includes(unit) || !userAreas.includes(area) || (cultivo && !cultivos.includes(cultivo))) {
             errors++;
             errorMessages.push(`Fila ${rowNum}: Valor inválido en categoría, unidad, área o cultivo.`);
             continue;
        }

        const existingProduct = productMap.get(sku);

        const newBatch: Batch = {
            id: lote_id,
            stock: Number(stock),
            expiry_date: expiry_date ? new Date(expiry_date).toISOString().split('T')[0] : undefined,
        };

        if (existingProduct) {
            const existingLote = existingProduct.batches.find((b: Batch) => b.id.toLowerCase() === lote_id.toLowerCase());
            if (existingLote) {
                errors++;
                errorMessages.push(`Fila ${rowNum}: El lote ID "${lote_id}" ya existe para el producto ${sku}.`);
                continue;
            }
            const updatedBatches = [...existingProduct.batches, newBatch];
            inventoryUpdates.push({ id: sku, batches: updatedBatches });
            updated++;
        } else {
            const newProduct: InventoryItem = {
                id: sku,
                name,
                description: description || '',
                category,
                area,
                cultivo: cultivo || undefined,
                location,
                unit,
                images: [],
                batches: [newBatch],
                ai_hint: `${category} ${name}`,
            };
            inventoryUpdates.push(newProduct);
            created++;
        }
        
        historyInserts.push({
            id: `HIST-${uuidv4().slice(0, 12)}`,
            date: new Date().toISOString(),
            product_id: sku,
            product_name: name,
            type: 'Entrada',
            quantity: Number(stock),
            unit: unit,
            requesting_area: 'Almacén',
            user_id: hardcodedUserId,
            lote_id: lote_id,
        });
    }

    if(inventoryUpdates.length > 0) {
        const { error: upsertError } = await supabase.from('inventory_items').upsert(inventoryUpdates, { onConflict: 'id' });
        if(upsertError) {
             return { success: false, message: `Error guardando productos: ${upsertError.message}` };
        }
    }

    if(historyInserts.length > 0) {
        const { error: historyError } = await supabase.from('inventory_history').insert(historyInserts);
         if(historyError) {
             return { success: false, message: `Error guardando historial: ${historyError.message}` };
        }
    }

    revalidatePath('/dashboard/inventory');

    if (errors > 0) {
        return { 
            success: false, 
            message: errorMessages.slice(0, 3).join(' '),
            processed: data.length,
            created,
            updated,
            errors,
        };
    }

    return { 
        success: true,
        processed: data.length,
        created,
        updated,
        errors,
    };
}
