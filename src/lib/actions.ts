
'use server';

import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';
import { getFirestoreAdmin, getAuthAdmin } from '@/firebase/admin';

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
    return { success: false, error: 'Invalid data.', warning: null };
  }

  const { name, email, phone, message, serviceName, startDate, endDate, origin, destination, totalPrice } = parsed.data;

  if (!process.env.RESEND_API_KEY || !process.env.BOOKING_EMAIL_TO) {
    console.error('Resend API Key or recipient email is not set in .env file.');
    return { success: false, error: 'Server is not configured to send emails.', warning: null };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // --- Prepare email content ---
    const detailsHtml = [
        { label: 'Service', value: serviceName },
        { label: 'Name', value: name },
        { label: 'Email', value: email },
        { label: 'Phone', value: phone },
        { label: 'Pickup', value: startDate && !endDate ? startDate : null },
        { label: 'Dates', value: (startDate && endDate) ? `${startDate} - ${endDate}` : null },
        { label: 'Origin', value: origin },
        { label: 'Destination', value: destination },
        { label: 'Estimated Price', value: totalPrice ? `$${totalPrice.toFixed(2)}` : null },
        { label: 'Message', value: message },
    ]
    .filter(item => item.value) // Filter out items with null/undefined/empty string values
    .map(item => `<li><strong>${item.label}:</strong> <span>${item.value}</span></li>`)
    .join('');


    // --- Prepare and send email to Admin ---
    const adminTemplateFile = await fs.readFile(emailTemplateFilePath, 'utf-8');
    const { template: adminTemplate } = JSON.parse(adminTemplateFile);
    
    let adminHtmlBody = adminTemplate.replace('{{detailsList}}', detailsHtml);
    adminHtmlBody = adminHtmlBody.replace(new RegExp('{{serviceName}}', 'g'), serviceName);
    adminHtmlBody = adminHtmlBody.replace(new RegExp('{{email}}', 'g'), email);

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
    
    let clientHtmlBody = clientTemplate.replace('{{detailsList}}', detailsHtml);
    clientHtmlBody = clientHtmlBody.replace(new RegExp('{{name}}', 'g'), name);
    clientHtmlBody = clientHtmlBody.replace(new RegExp('{{serviceName}}', 'g'), serviceName);
    
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
  
  if (!process.env.RESEND_API_KEY || !process.env.BOOKING_EMAIL_TO) {
    console.error('Resend API Key or recipient email is not set in .env file.');
    return { success: false, error: 'Server is not configured to send emails.' };
  }
  
  const { name, email, mobile, message } = parsed.data;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: 'TriPlanner Contact <onboarding@resend.dev>',
      to: [process.env.BOOKING_EMAIL_TO],
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
        const currentConfigRaw = await fs.readFile(settingsFilePath, 'utf-8').catch(() => '{}');
        const currentConfig = JSON.parse(currentConfigRaw);
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

    try {
        const authAdmin = getAuthAdmin();
        const firestoreAdmin = getFirestoreAdmin();
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
        const authAdmin = getAuthAdmin();
        const firestoreAdmin = getFirestoreAdmin();
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
        const firestoreAdmin = getFirestoreAdmin();
        await firestoreAdmin.collection('roles_admin').doc(id).update({ role: 'superadmin' });
        revalidatePath('/admin');
        return { success: true, error: null };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// --- Service Status Action ---
const updateServiceStatusSchema = z.object({
    serviceId: z.string(),
    category: z.string(),
    isActive: z.boolean(),
});

export async function updateServiceStatus(serviceId: string, category: string, isActive: boolean): Promise<{ success: boolean; error?: string | null; }> {
    const parsed = updateServiceStatusSchema.safeParse({ serviceId, category, isActive });
    if (!parsed.success) {
        return { success: false, error: 'Invalid data provided.' };
    }

    let collectionPath: string;
    switch(category) {
        case 'cars': collectionPath = 'carRentals'; break;
        case 'hotels': collectionPath = 'hotels'; break;
        case 'transport': collectionPath = 'transports'; break;
        case 'explore': collectionPath = 'exploreTrips'; break;
        default:
            return { success: false, error: 'Invalid service category.' };
    }

    try {
        const firestoreAdmin = getFirestoreAdmin();
        await firestoreAdmin.collection(collectionPath).doc(serviceId).set({ isActive }, { merge: true });
        
        revalidatePath('/admin');
        revalidatePath(`/services/${category}`);
        revalidatePath('/'); // Best offers and general service availability might change

        return { success: true, error: null };
    } catch (error: any) {
        console.error("Failed to update service status:", error);
        return { success: false, error: error.message || "Could not update the service status in the database." };
    }
}

// --- Service Best Offer Action ---
const updateServiceBestOfferSchema = z.object({
    serviceId: z.string(),
    category: z.string(),
    isBestOffer: z.boolean(),
});

export async function updateServiceBestOffer(serviceId: string, category: string, isBestOffer: boolean): Promise<{ success: boolean; error?: string | null; }> {
    const parsed = updateServiceBestOfferSchema.safeParse({ serviceId, category, isBestOffer });
    if (!parsed.success) {
        return { success: false, error: 'Invalid data provided.' };
    }

    let collectionPath: string;
    switch(category) {
        case 'cars': collectionPath = 'carRentals'; break;
        case 'hotels': collectionPath = 'hotels'; break;
        case 'transport': collectionPath = 'transports'; break;
        case 'explore': collectionPath = 'exploreTrips'; break;
        default:
            return { success: false, error: 'Invalid service category.' };
    }

    try {
        const firestoreAdmin = getFirestoreAdmin();
        await firestoreAdmin.collection(collectionPath).doc(serviceId).set({ isBestOffer }, { merge: true });
        
        revalidatePath('/admin');
        revalidatePath('/'); // Best offers are on the homepage

        return { success: true, error: null };
    } catch (error: any) {
        console.error("Failed to update service best offer status:", error);
        return { success: false, error: error.message || "Could not update the service best offer status." };
    }
}
