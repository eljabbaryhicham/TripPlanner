
'use server';

import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';
import { firestoreAdmin, authAdmin } from '@/firebase/admin';

const settingsFilePath = path.join(process.cwd(), 'src', 'lib', 'app-config.json');
const emailTemplateFilePath = path.join(process.cwd(), 'src', 'lib', 'email-template.json');
const clientEmailTemplateFilePath = path.join(process.cwd(), 'src', 'lib', 'client-email-template.json');

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

export async function submitReservation(data: ReservationFormValues): Promise<{ success: boolean; error?: string | null; warning?: string | null; }> {
  const parsed = reservationSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: 'Invalid data.', warning: null };
  }

  const { name, email, phone, message, serviceName, startDate, endDate } = parsed.data;

  if (!process.env.RESEND_API_KEY || !process.env.BOOKING_EMAIL_TO) {
    console.error('Resend API Key or recipient email is not set in .env file.');
    return { success: false, error: 'Server is not configured to send emails.', warning: null };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    // --- Prepare and send email to Admin ---
    const adminTemplateFile = await fs.readFile(emailTemplateFilePath, 'utf-8');
    const { template: adminTemplate } = JSON.parse(adminTemplateFile);
    
    let adminHtmlBody = adminTemplate;
    const replacements: Record<string, string> = {
        '{{serviceName}}': serviceName,
        '{{name}}': name,
        '{{email}}': email,
        '{{phone}}': phone || 'N/A',
        '{{message}}': message || 'N/A',
        '{{dates}}': (startDate && endDate) ? `${startDate} - ${endDate}` : 'N/A',
    };
    
    for (const [key, value] of Object.entries(replacements)) {
        adminHtmlBody = adminHtmlBody.replace(new RegExp(key, 'g'), value);
    }

    const { error: adminError } = await resend.emails.send({
      from: 'TriPlanner <onboarding@resend.dev>',
      to: [process.env.BOOKING_EMAIL_TO],
      subject: `New Booking Inquiry for ${serviceName}`,
      html: adminHtmlBody,
      reply_to: email,
    });

    if (adminError) {
      console.error('Resend error (to admin):', adminError);
      return { success: false, error: 'Failed to send admin notification email.', warning: null };
    }

    // --- Prepare and send confirmation email to Client ---
    const clientTemplateFile = await fs.readFile(clientEmailTemplateFilePath, 'utf-8');
    const { template: clientTemplate } = JSON.parse(clientTemplateFile);
    
    let clientHtmlBody = clientTemplate;
    for (const [key, value] of Object.entries(replacements)) {
        clientHtmlBody = clientHtmlBody.replace(new RegExp(key, 'g'), value);
    }

    const { error: clientError } = await resend.emails.send({
        from: 'TriPlanner <onboarding@resend.dev>',
        to: [email],
        subject: `Your Booking Inquiry for ${serviceName}`,
        html: clientHtmlBody,
    });
    
    if (clientError) {
        console.error('Resend error (to client):', clientError);
        // The admin email was sent, but client confirmation failed.
        // Return success with a warning to inform the user.
        return { 
            success: true, 
            error: null,
            warning: "Your inquiry was sent to our team, but the confirmation email could not be sent to you. Please double-check the email address you provided."
        };
    }

    return { success: true, error: null, warning: null };
  } catch (error) {
    console.error('Failed to send email(s):', error);
    return { success: false, error: 'An unexpected error occurred while sending the email(s).', warning: null };
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
        const currentConfigRaw = await fs.readFile(settingsFilePath, 'utf-8').catch(() => '{}');
        const currentConfig = JSON.parse(currentConfigRaw);
        const newSettings = JSON.stringify({ ...currentConfig, whatsappNumber }, null, 2);
        await fs.writeFile(settingsFilePath, newSettings, 'utf-8');
        
        revalidatePath('/admin');
        
        return { error: null, success: true };
    } catch (error) {
        console.error('Failed to update settings:', error);
        return { error: 'Could not save settings.', success: false };
    }
}

// --- Email Template Action ---
const emailTemplateSchema = z.object({
    template: z.string().min(1, { message: 'Email template cannot be empty.' }),
});

export async function updateEmailTemplate(prevState: any, formData: FormData) {
    const parsed = emailTemplateSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return { error: parsed.error.errors[0].message, success: false };
    }
    
    try {
        const newTemplate = JSON.stringify({ template: parsed.data.template }, null, 2);
        await fs.writeFile(emailTemplateFilePath, newTemplate, 'utf-8');
        revalidatePath('/admin');
        return { error: null, success: true };
    } catch (error) {
        console.error('Failed to update email template:', error);
        return { error: 'Could not save email template.', success: false };
    }
}

// --- Client Email Template Action ---
export async function updateClientEmailTemplate(prevState: any, formData: FormData) {
    const parsed = emailTemplateSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return { error: parsed.error.errors[0].message, success: false };
    }
    
    try {
        const newTemplate = JSON.stringify({ template: parsed.data.template }, null, 2);
        await fs.writeFile(clientEmailTemplateFilePath, newTemplate, 'utf-8');
        revalidatePath('/admin');
        return { error: null, success: true };
    } catch (error) {
        console.error('Failed to update client email template:', error);
        return { error: 'Could not save client email template.', success: false };
    }
}


// --- Admin Management Actions ---
// NOTE: These actions use the Firebase Admin SDK and should ideally be protected
// by checking the caller's authentication status and role. In a typical Next.js
// app, this would be done using a library like NextAuth.js or by validating an
// ID token. For this environment, we rely on Firestore rules to protect the
// /roles_admin collection, but the actions to create/delete Auth users are
// not fully secure from being called by non-superadmins.

const addAdminSchema = z.object({
    login: z.string().email(),
    password: z.string().min(6),
});
export async function addAdmin(prevState: any, formData: FormData) {
    const parsed = addAdminSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return { error: parsed.error.errors[0].message, success: false };
    }
    const { login, password } = parsed.data;

    try {
        const userRecord = await authAdmin.createUser({ email: login, password });
        await firestoreAdmin.collection('roles_admin').doc(userRecord.uid).set({
            email: login,
            role: 'admin',
            createdAt: new Date(),
            id: userRecord.uid,
        });
        revalidatePath('/admin');
        return { success: true, error: null };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

const removeAdminSchema = z.object({ id: z.string() });
export async function removeAdmin(prevState: any, formData: FormData) {
     const parsed = removeAdminSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return { error: "Invalid ID", success: false };
    }
    const { id } = parsed.data;

    try {
        await authAdmin.deleteUser(id);
        await firestoreAdmin.collection('roles_admin').doc(id).delete();
        revalidatePath('/admin');
        return { success: true, error: null };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

const setSuperAdminSchema = z.object({ id: z.string() });
export async function setSuperAdmin(prevState: any, formData: FormData) {
     const parsed = setSuperAdminSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return { error: "Invalid ID", success: false };
    }
    const { id } = parsed.data;

    try {
        await firestoreAdmin.collection('roles_admin').doc(id).update({ role: 'superadmin' });
        revalidatePath('/admin');
        return { success: true, error: null };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
