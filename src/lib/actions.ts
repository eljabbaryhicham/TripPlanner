'use server';

import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { firestoreAdmin } from '@/firebase/admin';
import placeholderData from './placeholder-images.json';
import type { Service } from './types';


const settingsFilePath = path.join(process.cwd(), 'src', 'lib', 'app-config.json');

// --- Reservation Action ---
const reservationSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().optional(),
  serviceName: z.string(),
  serviceId: z.string(),
  price: z.coerce.number(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type ReservationFormValues = z.infer<typeof reservationSchema>;

export async function submitReservation(data: ReservationFormValues) {
  const parsed = reservationSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: 'Invalid data.' };
  }

  // This is a mock for sending an email inquiry. In a real app,
  // this would use a transactional email service.
  console.log('--- New Reservation Inquiry ---');
  console.log('Service:', parsed.data.serviceName);
  console.log('Name:', parsed.data.name);
  console.log('Email:', parsed.data.email);
  // ... etc
  console.log('-----------------------------');

  await new Promise((resolve) => setTimeout(resolve, 1000));

  return { success: true };
}

// --- Settings Action ---

const settingsSchema = z.object({
    whatsappNumber: z.string().min(1, { message: 'WhatsApp number cannot be empty.' }),
});

export async function updateWhatsappNumber(prevState: { error: string | null, success: boolean }, formData: FormData) {
    const parsed = settingsSchema.safeParse(Object.fromEntries(formData));

    if (!parsed.success) {
        return { error: parsed.error.errors[0].message, success: false };
    }

    const { whatsappNumber } = parsed.data;
    
    try {
        const newSettings = JSON.stringify({ whatsappNumber }, null, 2);
        await fs.writeFile(settingsFilePath, newSettings, 'utf-8');
        
        revalidatePath('/admin');
        revalidatePath('/api/settings');
        
        return { error: null, success: true };
    } catch (error) {
        console.error('Failed to update settings:', error);
        return { error: 'Could not save settings.', success: false };
    }
}


// --- Database Seeding Action ---
export async function seedDatabase() {
    try {
        const services: Service[] = placeholderData.services;
        const batch = firestoreAdmin.batch();

        for (const service of services) {
            let collectionPath: string;
            switch(service.category) {
                case 'cars': collectionPath = 'carRentals'; break;
                case 'hotels': collectionPath = 'hotels'; break;
                case 'transport': collectionPath = 'transports'; break;
                default:
                    console.warn(`Unknown category: ${(service as any).category}`);
                    continue;
            }
            const docRef = firestoreAdmin.collection(collectionPath).doc(service.id);
            batch.set(docRef, service);
        }

        await batch.commit();

        // Revalidate all paths where services are displayed
        revalidatePath('/');
        revalidatePath('/services/cars');
        revalidatePath('/services/hotels');
        revalidatePath('/services/transport');
        revalidatePath('/admin');

        return { success: true };
    } catch (error: any) {
        console.error('Failed to seed database:', error);
        return { success: false, error: 'Could not seed the database. Check server logs for details.' };
    }
}
