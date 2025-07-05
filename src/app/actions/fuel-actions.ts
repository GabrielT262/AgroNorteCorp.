
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import type { FuelDispatchFormValues, FuelType } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export async function addFuelStockAction(data: { fuelType: FuelType, quantity: number }) {
    const newEntryId = `FUEL-IN-${uuidv4().slice(0, 8).toUpperCase()}`;
    try {
        await db.insert(schema.fuelHistory).values({
            id: newEntryId,
            type: 'Abastecimiento',
            fuelType: data.fuelType,
            quantity: data.quantity,
            registeredBy: 'Current User', // Placeholder
            date: new Date(),
        });
        revalidatePath('/dashboard/fuel');
        return { success: true };
    } catch (error) {
        console.error('Error adding fuel stock:', error);
        return { success: false, message: 'Error al añadir stock.' };
    }
}

export async function dispatchFuelAction(data: FuelDispatchFormValues) {
    const newEntryId = `FUEL-OUT-${uuidv4().slice(0, 8).toUpperCase()}`;
    try {
        await db.insert(schema.fuelHistory).values({
            id: newEntryId,
            type: 'Consumo',
            fuelType: data.fuelType,
            quantity: data.quantity,
            area: data.area,
            user: data.user,
            vehicleType: data.vehicleType,
            horometro: data.horometro,
            kilometraje: data.kilometraje,
            registeredBy: 'Current User', // Placeholder
            date: new Date(),
        });
        revalidatePath('/dashboard/fuel');
        return { success: true };
    } catch (error) {
        console.error('Error dispatching fuel:', error);
        return { success: false, message: 'Error al despachar combustible.' };
    }
}
