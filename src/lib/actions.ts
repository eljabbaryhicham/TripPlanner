
'use server';

import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';

const settingsFilePath = path.join(process.cwd(), 'src', 'lib', 'app-config.json');

// --- Reservation Action ---
const reservationSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
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

  const { name, email, phone, message, serviceName, startDate, endDate } = parsed.data;

  if (!process.env.RESEND_API_KEY || !process.env.BOOKING_EMAIL_TO) {
    console.error('Resend API Key or recipient email is not set in .env file.');
    return { success: false, error: 'Server is not configured to send emails.' };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { data, error } = await resend.emails.send({
      from: 'TriPlanner <onboarding@resend.dev>',
      to: [process.env.BOOKING_EMAIL_TO],
      subject: `New Booking Inquiry for ${serviceName}`,
      html: `
        <p>You have a new reservation inquiry:</p>
        <ul>
          <li><strong>Service:</strong> ${serviceName}</li>
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>Email:</strong> ${email}</li>
          ${phone ? `<li><strong>Phone:</strong> ${phone}</li>` : ''}
          ${startDate && endDate ? `<li><strong>Dates:</strong> ${startDate} - ${endDate}</li>` : ''}
          ${message ? `<li><strong>Message:</strong> ${message}</li>` : ''}
        </ul>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: 'Failed to send email.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: 'An unexpected error occurred while sending the email.' };
  }
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
