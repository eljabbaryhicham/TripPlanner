'use server';

import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';

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

export async function updateWhatsappNumber(prevState: any, formData: FormData) {
    const parsed = settingsSchema.safeParse(Object.fromEntries(formData));

    if (!parsed.success) {
        return { error: parsed.error.errors[0].message, success: false };
    }

    const { whatsappNumber } = parsed.data;
    
    try {
        // NOTE: In a real multi-server environment, this should be a centralized config service.
        // For this demo, writing to the filesystem is acceptable.
        const currentConfigRaw = await fs.readFile(settingsFilePath, 'utf-8').catch(() => '{}');
        const currentConfig = JSON.parse(currentConfigRaw);
        const newSettings = JSON.stringify({ ...currentConfig, whatsappNumber }, null, 2);
        await fs.writeFile(settingsFilePath, newSettings, 'utf-8');
        
        revalidatePath('/admin'); // Revalidates the admin page to show new number
        
        return { error: null, success: true };
    } catch (error) {
        console.error('Failed to update settings:', error);
        return { error: 'Could not save settings.', success: false };
    }
}
