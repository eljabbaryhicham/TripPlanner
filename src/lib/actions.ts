
'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';

// --- Login Action ---

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function login(
  prevState: { error: string | null },
  formData: FormData
) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: 'Invalid email or password format.' };
  }

  const { email, password } = parsed.data;

  // In a real app, you would validate against a database.
  if (
    email !== 'admin@triplanner.com' ||
    password !== 'password123'
  ) {
    return { error: 'Invalid email or password.' };
  }

  // Set a session cookie
  cookies().set('auth', 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24, // 1 day
    path: '/',
  });

  redirect('/admin');
}

export async function logout() {
  cookies().delete('auth');
  redirect('/login');
}

// --- Reservation Action ---
const reservationSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().optional(),
  serviceName: z.string(),
  serviceId: z.string(),
  price: z.number(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type ReservationFormValues = z.infer<typeof reservationSchema>;

export async function submitReservation(data: ReservationFormValues) {
  const parsed = reservationSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: 'Invalid data.' };
  }

  console.log('--- New Reservation Inquiry ---');
  console.log('Service:', parsed.data.serviceName);
  console.log('Name:', parsed.data.name);
  console.log('Email:', parsed.data.email);
  console.log('Phone:', parsed.data.phone || 'N/A');
  console.log('Start Date:', parsed.data.startDate || 'N/A');
  console.log('End Date:', parsed.data.endDate || 'N/A');
  console.log('Message:', parsed.data.message || 'N/A');
  console.log('-----------------------------');

  // Here you would integrate with Resend API
  // e.g., await resend.emails.send({ ... });

  // Simulate network delay
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
        const filePath = path.join(process.cwd(), 'src', 'lib', 'app-config.json');
        const newSettings = JSON.stringify({ whatsappNumber }, null, 2);
        await fs.writeFile(filePath, newSettings, 'utf-8');
        
        revalidatePath('/admin');
        revalidatePath('/api/settings');
        
        return { error: null, success: true };
    } catch (error) {
        console.error('Failed to update settings:', error);
        return { error: 'Could not save settings.', success: false };
    }
}
