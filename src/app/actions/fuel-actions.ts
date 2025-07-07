'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import type { FuelDispatchFormValues, FuelHistoryEntry, FuelType } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { getFuelLevels } from '@/lib/db';

export async function addFuelStockAction(data: { fuelType: FuelType, quantity: number }) {
    const newEntryId = `FUEL-IN-${uuidv4().slice(0, 8).toUpperCase()}`;
    const hardcodedUserId = 'usr_gabriel'; // Placeholder for actual user from session
    try {
        const newEntry: Omit<FuelHistoryEntry, 'id'> = {
            type: 'Abastecimiento',
            fuel_type: data.fuelType,
            quantity: data.quantity,
            registered_by_id: hardcodedUserId,
            date: new Date().toISOString(),
        };

        const { data: currentLevels, error: levelError } = await supabase
            .from('fuel_levels')
            .select('level')
            .eq('fuel_type', data.fuelType)
            .single();

        if(levelError) throw levelError;

        const newLevel = (currentLevels?.level || 0) + data.quantity;

        const { error: historyError } = await supabase.from('fuel_history').insert({ id: newEntryId, ...newEntry });
        if(historyError) throw historyError;
        
        const { error: updateError } = await supabase
            .from('fuel_levels')
            .update({ level: newLevel })
            .eq('fuel_type', data.fuelType);
        if(updateError) throw updateError;
        
        revalidatePath('/dashboard/fuel');
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error('Error adding fuel stock:', error);
        return { success: false, message: 'Error al añadir stock.' };
    }
}

export async function dispatchFuelAction(data: FuelDispatchFormValues) {
    const newEntryId = `FUEL-OUT-${uuidv4().slice(0, 8).toUpperCase()}`;
    const hardcodedUserId = 'usr_gabriel'; // Placeholder for actual user from session
    try {
        const fuelLevelsData = await getFuelLevels();
        if (fuelLevelsData[data.fuel_type] < data.quantity) {
             return { success: false, message: `No hay suficiente ${data.fuel_type} en el tanque.` };
        }

        const newEntry: Omit<FuelHistoryEntry, 'id'> = {
            type: 'Consumo',
            fuel_type: data.fuel_type,
            quantity: data.quantity,
            area: data.area,
            user_name: data.user_name,
            vehicle_type: data.vehicle_type,
            horometro: data.horometro,
            kilometraje: data.kilometraje,
            registered_by_id: hardcodedUserId, 
            date: new Date().toISOString(),
        };

        const newLevel = fuelLevelsData[data.fuel_type] - data.quantity;
        
        const { error: historyError } = await supabase.from('fuel_history').insert({ id: newEntryId, ...newEntry });
        if(historyError) throw historyError;

        const { error: updateError } = await supabase
            .from('fuel_levels')
            .update({ level: newLevel })
            .eq('fuel_type', data.fuel_type);
        if(updateError) throw updateError;

        revalidatePath('/dashboard/fuel');
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error('Error dispatching fuel:', error);
        return { success: false, message: 'Error al despachar combustible.' };
    }
}
