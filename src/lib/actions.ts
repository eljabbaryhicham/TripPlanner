'use server';

import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';
import type { Service } from './types';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

const settingsFilePath = path.join(process.cwd(), 'src', 'lib', 'app-config.json');

// This function now fetches public service data from Firestore for Server Components.
// It uses a server-side instance of the Firebase client.
export async function getServices(): Promise<Service[]> {
  try {
    const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const firestore = getFirestore(firebaseApp);

    const carRentalsCol = collection(firestore, 'carRentals');
    const hotelsCol = collection(firestore, 'hotels');
    const transportsCol = collection(firestore, 'transports');

    const [carRentalsSnap, hotelsSnap, transportsSnap] = await Promise.all([
      getDocs(carRentalsCol),
      getDocs(hotelsCol),
      getDocs(transportsCol),
    ]);

    const services: Service[] = [];
    carRentalsSnap.forEach(doc => services.push({ ...doc.data(), category: 'cars' } as Service));
    hotelsSnap.forEach(doc => services.push({ ...doc.data(), category: 'hotels' } as Service));
    transportsSnap.forEach(doc => services.push({ ...doc.data(), category: 'transport' } as Service));

    return services;
  } catch (error) {
    console.error("Failed to fetch services from Firestore:", error);
    return [];
  }
}

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