
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
    let processedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;
    const errorDetails: { row: number; message: string }[] = [];

    const categories: InventoryCategory[] = ["Herramientas", "Repuestos", "Fertilizantes", "Agroquímicos", "Varios", "Implementos de Riego", "Implementos de SST"];
    const units: InventoryUnit[] = ['Unidad', 'Kg', 'Litros', 'Metros'];
    const userAreas: UserArea[] = ['Gerencia', 'Logística', 'RR.HH', 'Seguridad Patrimonial', 'Almacén', 'Taller', 'Producción', 'Sanidad', 'SS.GG', 'Administrador'];
    const cultivos: InventoryCultivo[] = ['Uva', 'Palto'];

    type ProductImportRow = {
        sku: string;
        name: string;
        description?: string;
        category: InventoryCategory;
        area: UserArea;
        cultivo?: InventoryCultivo;
        location: string;
        unit: InventoryUnit;
        lote_id: string;
        stock: number;
        expiry_date?: string | number | Date;
    };

    const normalizeHeaders = (row: any): Partial<ProductImportRow> => {
        const mapping: { [key in keyof ProductImportRow]: string[] } = {
            sku: ['sku', 'código', 'codigo'],
            name: ['name', 'nombre', 'producto', 'nombre_del_producto'],
            description: ['description', 'descripción', 'descripcion'],
            category: ['category', 'categoría', 'categoria'],
            area: ['area', 'área'],
            cultivo: ['cultivo'],
            location: ['location', 'ubicación', 'ubicacion'],
            unit: ['unit', 'unidad', 'unidad_de_medida'],
            lote_id: ['lote_id', 'loteid', 'lote', 'id_del_lote'],
            stock: ['stock', 'cantidad', 'unidades'],
            expiry_date: ['expiry_date', 'vencimiento', 'expiración', 'fecha_de_vencimiento']
        };
        const normalizedRow: Partial<ProductImportRow> = {};
        for (const key in row) {
            const normalizedKey = Object.keys(mapping).find(k =>
                mapping[k as keyof ProductImportRow].includes(key.toLowerCase().trim().replace(/ /g, '_'))
            ) as keyof ProductImportRow | undefined;

            if (normalizedKey) {
                normalizedRow[normalizedKey] = row[key];
            }
        }
        return normalizedRow;
    };

    const { data: allProducts, error: fetchAllError } = await supabase.from('inventory_items').select('id, batches, name, unit');
    if (fetchAllError) {
        return { success: false, message: `Error al cargar productos existentes: ${fetchAllError.message}`, errors: 1, details: [{row: 0, message: fetchAllError.message}] };
    }
    const productMap = new Map(allProducts.map(p => [p.id, p as InventoryItem]));
    const pendingUpdates = new Map<string, InventoryItem>();
    const historyInserts: any[] = [];

    for (const [index, rawRow] of data.entries()) {
        processedCount++;
        const rowNum = index + 2;
        const row = normalizeHeaders(rawRow) as ProductImportRow;

        if (!row.sku || !row.name || !row.category || !row.area || !row.location || !row.unit || !row.lote_id || row.stock === undefined || row.stock === null) {
            errorDetails.push({ row: rowNum, message: 'Faltan datos requeridos (SKU, Nombre, Categoría, Área, Ubicación, Unidad, Lote ID, Stock).' });
            continue;
        }

        if (!categories.includes(row.category) || !units.includes(row.unit) || !userAreas.includes(row.area) || (row.cultivo && !cultivos.includes(row.cultivo))) {
            errorDetails.push({ row: rowNum, message: 'Valor inválido en Categoría, Unidad, Área o Cultivo.' });
            continue;
        }
        if (isNaN(Number(row.stock)) || Number(row.stock) < 0) {
            errorDetails.push({ row: rowNum, message: 'El Stock debe ser un número válido >= 0.' });
            continue;
        }

        const productSKU = String(row.sku);
        const loteID = String(row.lote_id);
        const stockQty = Number(row.stock);

        let productToUpdate: InventoryItem;
        let isNewProductInImport = false;
        
        if (pendingUpdates.has(productSKU)) {
            productToUpdate = pendingUpdates.get(productSKU)!;
        } else if (productMap.has(productSKU)) {
            productToUpdate = JSON.parse(JSON.stringify(productMap.get(productSKU)!));
            updatedCount++;
        } else {
            isNewProductInImport = true;
            createdCount++;
            productToUpdate = {
                id: productSKU, name: row.name, description: row.description || '', category: row.category,
                area: row.area, cultivo: row.cultivo || undefined, location: row.location,
                unit: row.unit, images: [], batches: [], ai_hint: `${row.category} ${row.name}`,
            };
        }

        const existingLote = productToUpdate.batches.find((b: Batch) => b.id.toLowerCase() === loteID.toLowerCase());
        if (existingLote) {
            errorDetails.push({ row: rowNum, message: `El lote ID "${loteID}" ya existe para el producto ${productSKU}.` });
            continue;
        }

        let formattedExpiryDate: string | undefined = undefined;
        if (row.expiry_date) {
            try {
                // Handle Excel's numeric date format
                const date = typeof row.expiry_date === 'number' ? new Date(1900, 0, row.expiry_date - 1) : new Date(row.expiry_date);
                if (!isNaN(date.getTime())) {
                    formattedExpiryDate = date.toISOString().split('T')[0];
                }
            } catch (e) { /* Ignore invalid date formats */ }
        }

        const newBatch: Batch = { id: loteID, stock: stockQty, expiry_date: formattedExpiryDate };
        productToUpdate.batches.push(newBatch);
        if (isNewProductInImport) {
            productToUpdate.name = row.name;
            productToUpdate.category = row.category;
            productToUpdate.unit = row.unit;
        }

        pendingUpdates.set(productSKU, productToUpdate);

        historyInserts.push({
            id: `HIST-${uuidv4().slice(0, 12)}`, date: new Date().toISOString(), product_id: productSKU,
            product_name: productToUpdate.name, type: 'Entrada', quantity: stockQty,
            unit: productToUpdate.unit, requesting_area: 'Almacén', user_id: hardcodedUserId, lote_id: loteID,
        });
    }

    if (errorDetails.length > 0) {
        return {
            success: false, message: `La importación falló con ${errorDetails.length} errores.`,
            details: errorDetails, processed: processedCount, created: 0,
            updated: 0, errors: errorDetails.length,
        };
    }

    if (pendingUpdates.size > 0) {
        const { error: upsertError } = await supabase.from('inventory_items').upsert(Array.from(pendingUpdates.values()), { onConflict: 'id' });
        if (upsertError) {
            return { success: false, message: `Error al guardar productos: ${upsertError.message}`, errors: 1, details: [{row: 0, message: upsertError.message }] };
        }
    }

    if (historyInserts.length > 0) {
        const { error: historyError } = await supabase.from('inventory_history').insert(historyInserts);
        if (historyError) {
            return { success: false, message: `Error al guardar el historial: ${historyError.message}`, errors: 1, details: [{row: 0, message: historyError.message }] };
        }
    }

    revalidatePath('/dashboard/inventory');

    return {
        success: true, message: `Se procesaron ${processedCount} filas.`,
        processed: processedCount, created: createdCount,
        updated: updatedCount, errors: 0,
    };
}
