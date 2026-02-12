
'use server';

import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';
import { manageAdmin } from '@/ai/flows/manage-admin-flow';
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// --- File paths for settings that can be written to ---
const settingsFilePath = path.join(process.cwd(), 'src', 'lib', 'app-config.json');
const emailTemplateFilePath = path.join(process.cwd(), 'src', 'lib', 'email-template.json');
const clientEmailTemplateFilePath = path.join(process.cwd(), 'src', 'lib', 'client-email-template.json');


// Lazy-initialize Firebase Admin
let adminFirestore: ReturnType<typeof getFirestore> | null = null;
function getAdminFirestore() {
    if (adminFirestore) {
        return adminFirestore;
    }
    if (getApps().length === 0) {
        // In a deployed environment (like Vercel), service account keys are stored in env variables
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        const credential = serviceAccountKey 
            ? cert(JSON.parse(serviceAccountKey)) 
            : undefined; // Will use Application Default Credentials if not set

        initializeApp({ credential, projectId: process.env.GCLOUD_PROJECT });
    }
    adminFirestore = getFirestore(getApp());
    return adminFirestore;
}

// --- Helper Functions ---

// Fills a template string with data.
function fillTemplate(template: string, data: Record<string, any>): string {
  let result = template;
  for (const key in data) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), data[key] || '');
  }
  return result;
}


// --- Reservation Action ---
const reservationSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  phone: z.string().optional(),
  message: z.string().optional(),
  serviceName: z.string(),
  serviceId: z.string(),
  totalPrice: z.number().nullable(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  origin: z.string().optional(),
  destination: z.string().optional(),
});

type ReservationFormValues = z.infer<typeof reservationSchema>;

export async function submitReservation(data: ReservationFormValues): Promise<{ success: boolean; error?: string | null; warning?: string | null; }> {
  const parsed = reservationSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: 'Invalid form data provided.' };
  }
  
  const { name, email, phone, message, serviceName, serviceId, startDate, endDate, origin, destination, totalPrice } = parsed.data;

  // --- Step 1: Save the inquiry to Firestore FIRST ---
  // This guarantees that the booking is logged in the system.
  try {
      const db = getAdminFirestore();
      const docRef = db.collection('inquiries').doc();
      const inquiryData = {
          id: docRef.id,
          customerName: name,
          email,
          phone: phone || null,
          message: message || null,
          serviceId,
          serviceName,
          bookingMethod: 'email',
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          origin: origin || null,
          destination: destination || null,
          totalPrice: totalPrice || null,
          createdAt: new Date(),
          status: 'pending',
          paymentStatus: 'unpaid',
      };
      await docRef.set(inquiryData);
  } catch (dbError: any) {
      console.error("CRITICAL: Failed to save email inquiry to Firestore:", dbError);
      return {
          success: false,
          error: "Your inquiry could not be saved to our system. Please try again later.",
      };
  }

  // --- Step 2: Attempt to send notification emails ---
  try {
    const appSettings = require('@/lib/app-config.json');
    const adminTemplateConfig = require('@/lib/email-template.json');
    const clientTemplateConfig = require('@/lib/client-email-template.json');
    const adminTemplate = adminTemplateConfig.template;
    const clientTemplate = clientTemplateConfig.template;
    
    const recipientEmail = appSettings?.bookingEmailTo;
    const fromEmail = appSettings?.resendEmailFrom;
    
    if (!process.env.RESEND_API_KEY) {
        return { success: true, warning: 'Inquiry saved, but server is not configured to send emails (Resend API Key is missing).' };
    }
    if (!recipientEmail || !fromEmail) {
        return { success: true, warning: 'Inquiry saved, but server is not configured to send emails (Recipient or "From" email is missing).' };
    }
    
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const detailsHtml = [
        { label: 'Service', value: serviceName },
        { label: 'Name', value: name },
        { label: 'Email', value: email },
        { label: 'Phone', value: phone },
        { label: 'Pickup', value: startDate && !endDate ? startDate : undefined },
        { label: 'Dates', value: (startDate && endDate) ? `${startDate} - ${endDate}` : undefined },
        { label: 'Origin', value: origin },
        { label: 'Destination', value: destination },
        { label: 'Estimated Price', value: totalPrice ? `$${totalPrice.toFixed(2)}` : undefined },
        { label: 'Message', value: message },
    ]
    .filter(item => item.value)
    .map(item => `<li><strong>${item.label}:</strong> <span>${item.value}</span></li>`)
    .join('');

    const templateData = {
        detailsList: detailsHtml,
        serviceName: serviceName,
        email: email,
        name: name
    };
    
    const adminHtmlBody = fillTemplate(adminTemplate, templateData);
    const clientHtmlBody = fillTemplate(clientTemplate, templateData);

    // Send both emails concurrently
    const [adminResult, clientResult] = await Promise.allSettled([
      resend.emails.send({
        from: fromEmail,
        to: [recipientEmail],
        subject: `New Booking Inquiry for ${serviceName}`,
        html: adminHtmlBody,
        reply_to: email,
      }),
      resend.emails.send({
        from: fromEmail,
        to: [email],
        subject: `Your Booking Inquiry for ${serviceName}`,
        html: clientHtmlBody,
      })
    ]);

    let warningMessage = null;
    if (adminResult.status === 'rejected') {
        console.error('Resend error (to admin):', adminResult.reason);
        warningMessage = "Your inquiry was saved, but we couldn't notify the administrator. They will follow up as soon as possible.";
    }
    if (clientResult.status === 'rejected') {
        console.error('Resend error (to client):', clientResult.reason);
        warningMessage = (warningMessage || "Your inquiry was saved,") + " but the confirmation email could not be delivered to you. Please check your email address.";
    }

    return { success: true, warning: warningMessage };

  } catch (emailError) {
    console.error('A critical error occurred during email submission:', emailError);
    return { success: true, warning: 'Your inquiry was saved, but an unexpected error occurred while sending notification emails.' };
  }
}

// --- Contact Form Action ---
const contactFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  mobile: z.string().optional(),
  message: z.string().min(10, { message: 'Message must be at least 10 characters.' }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export async function submitContactForm(data: ContactFormValues): Promise<{ success: boolean; error?: string | null; }> {
  const parsed = contactFormSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: 'Invalid data.' };
  }
  
  try {
    const appSettings = require('@/lib/app-config.json');
    const recipientEmail = appSettings.bookingEmailTo;
    const fromEmail = appSettings.resendEmailFrom || 'TriPlanner Contact <onboarding@resend.dev>';
    
    if (!process.env.RESEND_API_KEY || !recipientEmail) {
      console.error('Resend API Key or recipient email is not configured.');
      return { success: false, error: 'Server is not configured to send emails.' };
    }
    
    const { name, email, mobile, message } = parsed.data;

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: [recipientEmail],
      subject: `New Message from ${name}`,
      reply_to: email,
      html: `<p>You have a new contact form submission:</p>
             <ul>
               <li><strong>Name:</strong> ${name}</li>
               <li><strong>Email:</strong> ${email}</li>
               <li><strong>Mobile:</strong> ${mobile || 'N/A'}</li>
             </ul>
             <p><strong>Message:</strong></p>
             <p>${message}</p>`,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: 'Failed to send email.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}


// --- Settings Action ---

const generalSettingsSchema = z.object({
    whatsappNumber: z.string().min(1, { message: 'WhatsApp number cannot be empty.' }),
    bookingEmailTo: z.string().email({ message: 'A valid recipient email is required.' }),
    resendEmailFrom: z.string().min(1, { message: 'A "from" email is required for Resend.' }),
});

export async function updateGeneralSettings(prevState: any, formData: FormData) {
    const parsed = generalSettingsSchema.safeParse(Object.fromEntries(formData));

    if (!parsed.success) {
        return { error: parsed.error.errors[0].message, success: false };
    }

    const { whatsappNumber, bookingEmailTo, resendEmailFrom } = parsed.data;
    
    try {
        const configRaw = await fs.readFile(settingsFilePath, 'utf-8');
        const currentConfig = JSON.parse(configRaw);
        const newSettings = JSON.stringify({ ...currentConfig, whatsappNumber, bookingEmailTo, resendEmailFrom }, null, 2);
        await fs.writeFile(settingsFilePath, newSettings, 'utf-8');
        
        revalidatePath('/admin');
        
        return { error: null, success: true };
    } catch (error) {
        console.error('Failed to update settings:', error);
        return { error: 'Could not save settings.', success: false };
    }
}

// --- Category Settings Action ---
export async function updateCategorySettings(prevState: any, formData: FormData) {
    const data = Object.fromEntries(formData);
    const categoryStates = {
        cars: data.cars === 'on',
        hotels: data.hotels === 'on',
        transport: data.transport === 'on',
        explore: data.explore === 'on',
    };
    
    try {
        const configRaw = await fs.readFile(settingsFilePath, 'utf-8');
        const currentConfig = JSON.parse(configRaw);
        currentConfig.categories = categoryStates;
        const newSettings = JSON.stringify(currentConfig, null, 2);
        await fs.writeFile(settingsFilePath, newSettings, 'utf-8');
        
        revalidatePath('/admin');
        revalidatePath('/services/cars');
        revalidatePath('/services/hotels');
        revalidatePath('/services/transport');
        revalidatePath('/services/explore');
        revalidatePath('/'); // For header and homepage
        
        return { error: null, success: true };
    } catch (error) {
        console.error('Failed to update category settings:', error);
        return { error: 'Could not save category settings.', success: false };
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

    const result = await manageAdmin({
        action: 'add',
        email: login,
        password: password,
    });

    if (result.success) {
        revalidatePath('/admin');
        return { success: true, error: null };
    } else {
        console.error("Error adding admin:", result.message);
        return { success: false, error: result.message };
    }
}

const removeAdminSchema = z.object({ id: z.string() });
export async function removeAdmin(prevState: any, formData: FormData) {
     const parsed = removeAdminSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return { error: "Invalid ID", success: false };
    }
    const { id } = parsed.data;

    const result = await manageAdmin({
        action: 'remove',
        uid: id,
    });

    if (result.success) {
        revalidatePath('/admin');
        return { success: true, error: null };
    } else {
        return { success: false, error: result.message };
    }
}

const setSuperAdminSchema = z.object({ id: z.string() });
export async function setSuperAdmin(prevState: any, formData: FormData) {
    const parsed = setSuperAdminSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return { error: "Invalid ID", success: false };
    }
    const { id } = parsed.data;

    const result = await manageAdmin({
        action: 'promote',
        uid: id,
    });

    if (result.success) {
        revalidatePath('/admin');
        return { success: true, error: null };
    } else {
        return { success: false, error: result.message };
    }
}
